// React Hooks：用來管理畫面狀態與生命週期
import { useState, useEffect, useRef } from "react";

// 從你自己寫的 firebaseConfig.js 拿到 Firestore 實例
import { db } from "../firebaseConfig";

// 從 Firebase Firestore 套件拿各種操作函式
import {
  collection,   // 指向某一個「集合」（類似一張資料表）
  addDoc,       // 新增一筆文件
  serverTimestamp, // 讓 Firestore 自己填入伺服器時間
  onSnapshot,   // 即時監聽資料變化
  query,        // 建立查詢條件
  orderBy,      // 排序
  updateDoc,    // 更新文件
  deleteDoc,    // 刪除文件
  doc,          // 指向某一筆文件
} from "firebase/firestore";

// Home 是這個頁面的主要元件（component）
// Next.js 會把這個元件當成 / 的畫面
export default function Home() {
  // ------- React 狀態（State）區 -------

  // text：輸入框內容
  // setText：用來修改 text 的函式
  const [text, setText] = useState("");

  // todos：從 Firestore 讀出來的待辦清單（陣列）
  // setTodos：更新待辦清單用
  const [todos, setTodos] = useState([]);

  // ------- 讀取 Firestore 並即時同步 -------

  const inputRef = useRef(null); 
  // 👈 讓我們可以操作輸入框（用來 focus）
  
  // useEffect：在元件第一次載入時執行這一段程式
  // [] 作為第二個參數 → 代表只在「初次載入」時跑一次
  useEffect(() => {
    // 建立一個查詢：
    // - 指向 "todos" 這個集合
    // - 依照 createdAt 欄位由新到舊排序（desc = 由大到小）
    const q = query(
      collection(db, "todos"),
      orderBy("createdAt", "desc")
    );

    // onSnapshot：即時監聽這個查詢結果
    // - 只要 "todos" 集合有新增 / 修改 / 刪除
    // - 這個 callback 就會再被觸發一次
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // snapshot.docs 是一個文件陣列
      // 每個 d 代表一筆 Firestore 文件
      const items = snapshot.docs.map((d) => ({
        id: d.id,   // Firestore 自動產生的文件 ID（之後刪除 / 更新要用）
        ...d.data() // 把文件裡面所有資料展開：text, completed, createdAt
      }));

      // 更新 React 狀態 → 觸發畫面重新渲染
      setTodos(items);
    });

    // 回傳一個函式：當這個 component 被卸載（unmount）時會呼叫
    // 這裡用來「取消訂閱」onSnapshot，避免記憶體洩漏
    return () => unsubscribe();
  }, []); // [] 代表只跑一次，不會每次 re-render 都再訂閱

  // ------- 新增待辦：寫入 Firestore -------

  async function addTodo() {
    // 去掉前後空白
    const trimmed = text.trim();
    // 如果輸入是空的，就直接不做任何事
    if (!trimmed) return;

    // addDoc：在 "todos" 集合裡新增一筆文件
    await addDoc(collection(db, "todos"), {
      text: trimmed,        // 待辦文字內容
      completed: false,     // 一開始預設為「未完成」
      createdAt: serverTimestamp(), // 建立時間交給 Firestore 自己填
    });

    // 清空輸入框（畫面上的 input 會跟著變成空字串）
    setText("");
	
	if (inputRef.current) {
		inputRef.current.focus();
   }
  }

  // ------- 切換完成 / 未完成 -------

  async function toggleTodo(todo) {
    // 先取得這一筆 todo 在 Firestore 的文件位置
    const ref = doc(db, "todos", todo.id);

    // updateDoc：只更新這個文件的部分欄位
    await updateDoc(ref, {
      completed: !todo.completed, // true <-> false 互相切換
    });
  }

  // ------- 刪除待辦 -------

  async function removeTodo(id) {
    // 找到這一筆文件的位置
    const ref = doc(db, "todos", id);

    // 刪除這一筆文件
    await deleteDoc(ref);
  }

  // ------- 畫面 (JSX) 區 -------

  // return 裡面就是畫面要顯示的內容（類似 HTML，但其實是 JSX）
  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-6 rounded-xl shadow-md">
      {/* 標題區塊 */}
      <h1 className="text-2xl font-bold mb-4 text-center">我的待辦清單</h1>

      {/* 輸入 + 新增按鈕區塊 */}
      <div className="flex gap-2 mb-4">
        {/* 文字輸入框 */}
        <textarea
		  ref={inputRef}                           // 👈 讓 addTodo 可以重新 focus
          className="flex-1 border rounded px-3 py-2 resize-none"
          placeholder="輸入待辦事項..."
          value={text}                       // 輸入框顯示的值來自 state
          onChange={(e) => setText(e.target.value)} // 每次輸入文字，更新 state
		  onKeyDown={(e) => {
			  // Enter（沒有按 Shift） → 送出
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault(); // 阻止 textarea 自己換行
				addTodo();
			}
			// Shift + Enter → 不阻止，讓它正常換行
		  }}
        />

        {/* 新增按鈕 */}
        <button
          onClick={addTodo} // 按下去就呼叫 addTodo()
          className="bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600"
        >
          新增
        </button>
      </div>

      {/* 待辦列表區塊 */}
      <div className="mt-4">
        {/* 如果目前沒有任何待辦，就顯示一行提示文字 */}
        {todos.length === 0 ? (
          <p className="text-sm text-gray-500">
            目前沒有待辦，先新增一個吧！
          </p>
        ) : (
          // 有待辦的情況：用 <ul> 把每一筆列出來
          <ul className="space-y-2">
            {todos.map((todo) => (
              <li
                key={todo.id} // React 要求列表的每一項需要 key
                className="flex items-center justify-between border rounded px-3 py-2"
              >
                {/* 左側：勾選框 + 文字 */}
                <div className="flex items-center gap-2">
                  {/* Checkbox：代表完成狀態 */}
                  <input
                    type="checkbox"
                    checked={!!todo.completed} // 用 !! 保證是 true/false
                    onChange={() => toggleTodo(todo)} // 勾選時切換完成狀態
                  />

                  {/* 待辦文字：完成的話畫刪除線 + 變灰色 */}
                  <span
                    className={
                      todo.completed
                        ? "line-through text-gray-400"
                        : ""
                    }
                  >
                    {todo.text}
                  </span>
                </div>

                {/* 右側：刪除按鈕 */}
                <button
                  onClick={() => removeTodo(todo.id)} // 按下去就刪掉這一筆
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  🗑️
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
