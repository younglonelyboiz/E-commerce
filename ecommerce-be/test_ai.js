import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api/v1';

async function runTests() {
  console.log("=== BẮT ĐẦU TEST LƯỒNG RAG ===");
  try {
    // 1. Quick Login để lấy Cookie
    console.log("\n[1] Đang lấy token đăng nhập...");
    const loginRes = await axios.post(`${BASE_URL}/quick-login`, {
      accountType: "user"
    });
    
    // Axios tự động parse set-cookie, nhưng mình sẽ lấy thủ công để dễ dùng cho các request sau
    const cookies = loginRes.headers['set-cookie'];
    if (!cookies) {
      throw new Error("Không lấy được Cookie từ Quick Login");
    }
    const cookieHeader = cookies[0].split(';')[0];
    console.log("✅ Đăng nhập thành công, Cookie:", cookieHeader.substring(0, 30) + "...");

    const axiosConfig = {
      headers: {
        Cookie: cookieHeader
      }
    };

    // 2. Test Hỏi đáp AI
    console.log("\n[2] Đang gửi câu hỏi cho AI Chat: 'có điện thoại nào ngon không?'...");
    const chatRes1 = await axios.post(`${BASE_URL}/ai-chat`, {
      question: "có điện thoại nào ngon không?"
    }, axiosConfig);
    console.log("✅ Kết quả (Câu 1):");
    console.log(" - Trả lời:", chatRes1.data.DT.answer);
    console.log(" - Sản phẩm gợi ý:", chatRes1.data.DT.source_products.map(p => p.name).join(", "));
    console.log(" - Conversation ID:", chatRes1.data.DT.conversation_id);

    // 3. Test Hỏi tiếp (có lịch sử)
    console.log("\n[3] Đang gửi câu hỏi tiếp theo: 'giá bao nhiêu?' (để test Query Rewrite)...");
    const chatRes2 = await axios.post(`${BASE_URL}/ai-chat`, {
      question: "giá bao nhiêu vậy?"
    }, axiosConfig);
    console.log("✅ Kết quả (Câu 2):");
    console.log(" - Trả lời:", chatRes2.data.DT.answer);
    console.log(" - Sản phẩm gợi ý:", chatRes2.data.DT.source_products.map(p => p.name).join(", "));

    // 4. Test Lấy lịch sử
    console.log("\n[4] Đang lấy lịch sử chat...");
    const historyRes = await axios.get(`${BASE_URL}/ai-chat/history`, axiosConfig);
    console.log(`✅ Lịch sử có ${historyRes.data.DT.length} tin nhắn.`);
    
    // 5. Test Reset Chat
    console.log("\n[5] Đang reset lịch sử chat...");
    const resetRes = await axios.delete(`${BASE_URL}/ai-chat`, axiosConfig);
    console.log("✅", resetRes.data.EM);

    console.log("\n=== TẤT CẢ TEST CASE ĐÃ PASSED ===");

  } catch (error) {
    console.error("\n❌ LỖI TRONG QUÁ TRÌNH TEST:");
    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

runTests();
