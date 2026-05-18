"""
Service Layer: RAG pipeline với query rewrite và product enrichment.

Luồng:
  1. Query Rewrite (LLM #1 nhẹ) — dùng history để rewrite câu hỏi
  2. Vector Search (Pinecone) — dùng query đã rewrite
  3. Rerank — rule-based
  4. Product Enrichment (MariaDB READ-ONLY) — lấy giá/tồn kho real-time
  5. Generate Answer (LLM #2) — trả lời đầy đủ ngữ cảnh
"""
import json
from google import genai
from google.genai import errors
from repositories.vector_repo import VectorRepository
from repositories.product_repo import ProductRepository
from utils.search_utils import simple_rerank
from core.config import settings


class RAGService:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.vector_repo = VectorRepository()
        self.product_repo = ProductRepository()
        self.model_name = "gemini-3.1-flash-lite"

    # ------------------------------------------------------------------ #
    #  Private: Query Rewrite                                              #
    # ------------------------------------------------------------------ #
    def _rewrite_query(self, question: str, history: list) -> str:
        """
        Dùng history để rewrite câu hỏi thiếu ngữ cảnh.
        Ví dụ: "giá bao nhiêu?" + history → "iPhone 17 Pro Max giá bao nhiêu?"

        Nếu không có history, trả nguyên câu hỏi (không tốn API call).
        """
        if not history:
            return question

        # Format history gọn lại để giảm token
        history_text = "\n".join(
            f"{'Khách' if h['role'] == 'user' else 'AI'}: {h['content']}"
            for h in history[-6:]  # Chỉ lấy 6 turn gần nhất cho rewrite
        )

        prompt = f"""Dựa vào lịch sử hội thoại sau, hãy viết lại câu hỏi cuối cùng \
cho đầy đủ ngữ cảnh để có thể tìm kiếm sản phẩm độc lập.
Chỉ trả về đúng câu hỏi đã rewrite, KHÔNG giải thích thêm.

Lịch sử:
{history_text}

Câu hỏi cần rewrite: {question}"""

        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
        )
        rewritten = response.text.strip()
        print(f"\n[Query Rewrite] '{question}' → '{rewritten}'")
        return rewritten

    # ------------------------------------------------------------------ #
    #  Public: Main RAG Pipeline                                           #
    # ------------------------------------------------------------------ #
    async def get_answer(self, question: str, history: list = None):
        if history is None:
            history = []

        try:
            # ── Bước 1: Query Rewrite ─────────────────────────────────────
            rewritten_query = self._rewrite_query(question, history)

            # ── Bước 2: Vector Search (dùng query đã rewrite) ────────────
            raw_results = self.vector_repo.search_similar(rewritten_query, n_results=15)

            # ── Bước 3: Rerank ────────────────────────────────────────────
            docs, metas = simple_rerank(rewritten_query, raw_results)
            top_docs = docs[:3]
            top_metas = metas[:3]

            # ── Bước 4: Product Enrichment — giá/tồn kho real-time ───────
            vector_product_ids = [
                m.get("product_id") for m in top_metas if m.get("product_id")
            ]
            live_products = self.product_repo.get_products_by_ids(vector_product_ids)

            # Map product_id → live data để build context nhanh
            live_map = {str(p["id"]): p for p in live_products}

            # ── Bước 5: Build Context (ưu tiên giá real-time từ DB) ───────
            context_text = ""
            for d, m in zip(top_docs, top_metas):
                pid = str(m.get("product_id", ""))
                live = live_map.get(pid)
                if live:
                    # Dùng giá + tồn kho real-time từ DB thay vì dữ liệu cũ trong vector
                    price_info = (
                        f"Giá: {live['discount_price']:,.0f}đ "
                        f"(gốc: {live['regular_price']:,.0f}đ)"
                        if live["discount_price"] and live["discount_price"] < live["regular_price"]
                        else f"Giá: {live['regular_price']:,.0f}đ"
                    )
                    stock_info = (
                        f"Còn hàng ({live['quantity']} máy)"
                        if live["quantity"] > 0
                        else "Hết hàng"
                    )
                    context_text += (
                        f"[ID: {pid}] {live['name']} | {price_info} | {stock_info}\n"
                    )
                else:
                    # Fallback: dùng dữ liệu từ vector nếu không có trong DB
                    context_text += f"[ID: {pid}] {d}\n"

            # ── Bước 6: Build Prompt ──────────────────────────────────────
            history_text = ""
            if history:
                history_text = "\nLỊCH SỬ HỘI THOẠI:\n" + "\n".join(
                    f"{'Khách' if h['role'] == 'user' else 'AI'}: {h['content']}"
                    for h in history[-10:]
                )

            prompt = f"""Bạn là AI tư vấn viên của shop điện máy. Nhiệm vụ: tư vấn sản phẩm \
chính xác, thân thiện, dựa HOÀN TOÀN vào dữ liệu được cung cấp.
{history_text}

DANH SÁCH SẢN PHẨM PHÙ HỢP (DỮ LIỆU THỰC TẾ):
---
{context_text}
---

CÂU HỎI HIỆN TẠI: "{question}"

QUY TẮC BẮT BUỘC:
1. Chỉ tư vấn sản phẩm CÓ trong danh sách trên. Nếu không tìm thấy, nói thật.
2. Nêu rõ giá và tình trạng kho từ dữ liệu trên.
3. Gợi ý tối đa 3 sản phẩm phù hợp nhất, ưu tiên còn hàng.
4. Giọng điệu: thân thiện, chuyên nghiệp, dùng tiếng Việt tự nhiên.
5. NẾU CÂU HỎI KHÔNG LIÊN QUAN ĐẾN SẢN PHẨM HOẶC KHÔNG TÌM THẤY SẢN PHẨM PHÙ HỢP, BẮT BUỘC TRẢ VỀ "suggested_ids": [].

TRẢ VỀ JSON:
{{
    "answer": "Nội dung tư vấn chi tiết",
    "suggested_ids": [id1, id2, id3]
}}"""

            # ── Bước 7: Generate Answer (LLM #2) ─────────────────────────
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config={"response_mime_type": "application/json"},
            )

            try:
                res_data = json.loads(response.text)
                suggested_ids = [str(sid) for sid in res_data.get("suggested_ids", [])]

                # Trả về sản phẩm có đủ data (ảnh, giá, slug) để FE render card clickable
                source_products = [
                    p for p in live_products if str(p["id"]) in suggested_ids
                ]

                return {
                    "answer": res_data.get("answer", ""),
                    "source_products": source_products[:3],
                }

            except Exception as e:
                print(f"[RAG] JSON parse error: {e}")
                return {
                    "answer": response.text,
                    "source_products": live_products[:3],
                }

        except errors.ClientError as e:
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                print(f"[RAG] Quota exceeded: {e}")
                return {
                    "answer": "Xin lỗi bạn, hiện tại hệ thống AI đang tạm thời quá tải hoặc hết hạn ngạch (Quota). Vui lòng thử lại sau vài phút hoặc liên hệ hỗ trợ viên nhé!",
                    "source_products": []
                }
            else:
                print(f"[RAG] ClientError: {e}")
                raise e
        except Exception as e:
            print(f"[RAG] Unknown error: {e}")
            raise e