from google import genai
import json
from repositories.vector_repo import VectorRepository
from utils.search_utils import simple_rerank
from core.config import settings

class RAGService:
    def __init__(self):
        # Khởi tạo các thành phần theo đúng phân tầng
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.vector_repo = VectorRepository()
        self.model_name = "gemini-2.5-flash"

    async def get_answer(self, question: str, history: list = None):
        if history is None:
            history = []
        # 1. Tầng Repository: Lấy dữ liệu thô từ Vector DB
        raw_results = self.vector_repo.search_similar(question, n_results=15)

        # 2. Rerank
        docs, metas = simple_rerank(question, raw_results)

        # --- ĐOẠN SOI VỊ TRÍ (DEBUG) ---
        print(f"\n SOI KÈO RERANK CHO CÂU HỎI: '{question}'")
        found_target = False
        for i, (d, m) in enumerate(zip(docs, metas)):
            # Kiểm tra xem có phải iPhone 17 không (hoặc keyword ông muốn soi)
            if "17" in d:
                print(f" [TOP {i+1}] ID: {m.get('product_id')} - {d[:60]}...")
                found_target = True
            elif i < 3: # In thêm top 3 để đối chiếu
                print(f"   [TOP {i+1}] ID: {m.get('product_id')} - {d[:60]}...")
        
        if not found_target:
            print(" Không thấy con iPhone 17 nào trong Top 15 bốc về!")
        print("-" * 50)

        # 3. CHỐT HẠ: Chỉ lấy Top 3 sau khi đã Rerank để gửi cho AI
        top_docs = docs[:3]
        top_metas = metas[:3]

        # 4. Build Context cực gọn
        context_text = ""
        for d, m in zip(top_docs, top_metas):
            context_text += f"[ID: {m.get('product_id')}] {d}\n"

        # 4. Prompt thiết kế gắt để AI không dám "ảo giác"
        prompt = f"""
        Bạn là một AI kiểm kho cực kỳ chính xác của 1 shop điện máy.
        
        DANH SÁCH SẢN PHẨM TRONG KHO (CONTEXT):
        ---
        {context_text}
        ---

        CÂU HỎI KHÁCH HÀNG: "{question}"

        QUY TẮC TƯ VẤN (BẮT BUỘC):
        1. ĐỐI CHIẾU CHÍNH XÁC: Nếu khách hỏi một model cụ thể (ví dụ 'Pro Max') mà trong DANH SÁCH có hàng, TUYỆT ĐỐI KHÔNG được trả lời là 'chưa có thông tin'.
        2. THÔNG TIN: Nêu bật các thông số kỹ thuật có sẵn trong dữ liệu.
        3. GIÁ CẢ: Nếu không thấy giá, hãy bảo khách nhắn tin riêng để nhận giá 'nét'.
        4. GỢI Ý: Chọn tối đa 3 ID sản phẩm khớp nhất.

        TRẢ VỀ ĐỊNH DẠNG JSON:
        {{
            "answer": "Nội dung tư vấn niềm nở, chuyên nghiệp",
            "suggested_ids": [id1, id2, id3]
        }}
        """

        # 5. Gọi Gemini (Sử dụng JSON Mode)
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config={'response_mime_type': 'application/json'}
        )
        
        try:
            res_data = json.loads(response.text)
            selected_ids = res_data.get('suggested_ids', [])
            
            # Lọc metadata từ danh sách đã rerank để trả về cho Frontend
            final_products = [
                m for m in metas 
                if m.get('product_id') in selected_ids
            ]

            return {
                "answer": res_data['answer'],
                "source_products": final_products[:3]
            }
        except Exception as e:
            # Fallback nếu parse JSON lỗi (hiếm khi xảy ra với Gemini 1.5)
            return {
                "answer": response.text,
                "source_products": metas[:3]
            }