import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import time
import json
import os

# Cấu hình tối ưu cho máy RAM 8GB
MAX_WORKERS = 2 
LIMIT_PRODUCTS = 100  # Giới hạn mỗi danh mục chỉ lấy 100 sản phẩm

def get_scraped_urls(filename):
    if not os.path.exists(filename): return set()
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return {item['url'] for item in data}
    except: return set()

def save_incremental(data, filename):
    current_data = []
    if os.path.exists(filename):
        with open(filename, 'r', encoding='utf-8') as f:
            try: current_data = json.load(f)
            except: current_data = []
    current_data.append(data)
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(current_data, f, ensure_ascii=False, indent=4)

def crawl_category(category_url):
    slug = category_url.rstrip('/').split('/')[-1].replace('.html', '')
    file_name = f"{slug}.json"
    
    print(f"\n📂 Bắt đầu danh mục: {slug.upper()}")
    scraped_urls = get_scraped_urls(file_name)
    
    # Kiểm tra nếu file hiện tại đã đủ 100 sản phẩm thì bỏ qua danh mục này
    if len(scraped_urls) >= LIMIT_PRODUCTS:
        print(f" Danh mục {slug} đã đủ {LIMIT_PRODUCTS} sản phẩm. Chuyển mục tiếp theo.")
        return

    options = uc.ChromeOptions()
    options.add_argument('--headless') # RAM 8GB bắt buộc chạy ẩn để không crash
    options.add_argument('--blink-settings=imagesEnabled=false')
    options.add_argument(f'--user-data-dir={os.getcwd()}/profile_{slug}')

    driver = uc.Chrome(options=options, version_main=144)
    
    try:
        driver.get(category_url)
        
        # --- BƯỚC 1: LOAD DANH MỤC CHO ĐẾN KHI ĐỦ 100 LINK ---
        print(f"🔍 Đang thu thập danh sách sản phẩm (Giới hạn: {LIMIT_PRODUCTS})...")
        while True:
            soup_temp = BeautifulSoup(driver.page_source, 'lxml')
            current_items = soup_temp.find_all('div', class_='product-info-container')
            
            if len(current_items) >= LIMIT_PRODUCTS:
                print(f"📍 Đã tìm thấy {len(current_items)} sản phẩm.")
                break
                
            try:
                load_more = WebDriverWait(driver, 3).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "a.button__show-more-product"))
                )
                driver.execute_script("arguments[0].click();", load_more)
                time.sleep(1.2)
            except:
                print("🏁 Đã tải hết sản phẩm của danh mục này.")
                break

        # Bóc tách des1
        final_soup = BeautifulSoup(driver.page_source, 'lxml')
        all_items = final_soup.find_all('div', class_='product-info-container')[:LIMIT_PRODUCTS]
        
        links = []
        des1_map = {}

        for it in all_items:
            link_tag = it.find('a', class_='product__link')
            if not link_tag: continue
            url = link_tag['href']
            if not url.startswith('http'): url = "https://cellphones.com.vn" + url
            if url in scraped_urls: continue
            
            links.append(url)
            img = it.find('img', class_='product__img')
            des1_map[url] = {
                "name": it.find('div', class_='product__name').get_text(strip=True) if it.find('div', class_='product__name') else "N/A",
                "sale_price": it.find('p', class_='product__price--show').get_text(strip=True) if it.find('p', class_='product__price--show') else "0",
                "original_price": it.find('p', class_='product__price--through').get_text(strip=True) if it.find('p', class_='product__price--through') else "0",
                "quick_info": [b.get_text(strip=True) for b in it.find_all('p', class_='product__more-info__item')],
                "thumbnail": img.get('data-src') or img.get('src') if img else ""
            }

        # --- BƯỚC 2: ĐÀO SÂU CHI TIẾT (Lấy des2 & reviews) ---
        remaining_slots = LIMIT_PRODUCTS - len(scraped_urls)
        to_crawl = links[:remaining_slots]

        for i, url in enumerate(to_crawl):
            try:
                print(f" [{slug}] {i+1}/{len(to_crawl)}: {url}")
                item_data = {
                    "url": url,
                    "des1": des1_map[url],
                    "des2": {"images": [], "full_specs": {}},
                    "reviews": []
                }

                # Vào trang chi tiết lấy Specs và Ảnh gallery
                driver.get(url)
                time.sleep(1)
                p_soup = BeautifulSoup(driver.page_source, 'lxml')
                
                # Gallery images
                for img in p_soup.select('div.thumbnail-slide img'):
                    src = img.get('data-src') or img.get('src')
                    if src: item_data["des2"]["images"].append(src.replace('rs:fill:58:58', 'rs:fill:358:358'))

                # Specs chi tiết
                for row in p_soup.select('table.technical-content tr.technical-content-item'):
                    tds = row.find_all('td')
                    if len(tds) == 2:
                        item_data["des2"]["full_specs"][tds[0].get_text(strip=True)] = tds[1].get_text(strip=True)

                # Reviews (Click cho đến khi hết review)
                review_url = url.replace(".html", "/review")
                driver.get(review_url)
                time.sleep(1)
                while True:
                    try:
                        btn = WebDriverWait(driver, 2).until(EC.element_to_be_clickable((By.CSS_SELECTOR, "a.button__view-more-review")))
                        driver.execute_script("arguments[0].click();", btn)
                        time.sleep(0.7)
                    except: break

                r_soup = BeautifulSoup(driver.page_source, 'lxml')
                for r_it in r_soup.find_all('div', class_='boxReview-comment-item'):
                    item_data["reviews"].append({
                        "user": r_it.find('span', class_='name').get_text(strip=True) if r_it.find('span', class_='name') else "Ẩn danh",
                        "stars": len(r_it.find_all('div', class_='icon is-active')),
                        "content": r_it.find('div', class_='comment-content').get_text(strip=True) if r_it.find('div', class_='comment-content') else ""
                    })

                save_incremental(item_data, file_name)
            except Exception as e:
                print(f" Lỗi sản phẩm: {e}")
                continue
    finally:
        driver.quit()

if __name__ == "__main__":
    # Danh sách các link danh mục bạn yêu cầu
    categories = [
        "https://cellphones.com.vn/tablet.html",
        "https://cellphones.com.vn/thiet-bi-am-thanh.html",
        "https://cellphones.com.vn/thiet-bi-am-thanh/micro-thu-am.html",
        "https://cellphones.com.vn/do-choi-cong-nghe.html",
        "https://cellphones.com.vn/phu-kien/camera.html",
        "https://cellphones.com.vn/may-tinh-de-ban.html",
        "https://cellphones.com.vn/man-hinh.html",
        "https://cellphones.com.vn/tivi.html"
    ]
    
    for cat in categories:
        crawl_category(cat)
        print(f"---  HOÀN THÀNH DANH MỤC: {cat} ---\n")