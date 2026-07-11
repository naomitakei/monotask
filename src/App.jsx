import React, { useState } from "react";
import "./App.css";

// バックエンド（Spring Boot）のURLを設定
const API_BASE_URL = "http://localhost:8080/api/tasks";

function App() {
  // 画面の状態を管理する変数（ステート）
  const [taskName, setTaskName] = useState(""); // 入力欄の文字
  const [errorMessage, setErrorMessage] = useState(""); // エラーメッセージ
  const [isFocusMode, setIsFocusMode] = useState(false); // 集中画面への切り替えフラグ
  const [focusTask, setFocusTask] = useState(null); // 今やるべき1つのタスク

  // 【機能1】タスク追加ボタンを押したときの処理
  const handleAddTask = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // --- 画面設計書通りの入力制限（必須チェック） ---
    if (!taskName.trim()) {
      setErrorMessage("「タスク内容を入力してください。」");
      return;
    }
    // --- 画面設計書通りの入力制限（文字数チェック） ---
    if (taskName.length > 100) {
      setErrorMessage("「タスク内容は100文字以内で入力してください。」");
      return;
    }

    try {
      // Spring Bootの登録APIを呼び出す
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskName: taskName }),
      });

      if (response.ok) {
        setTaskName(""); // 登録成功したら入力欄を自動クリア（画面制御要件）
        alert("タスクを追加しました！");
      } else {
        setErrorMessage(
          "登録に失敗しました。サーバーのエラーを確認してください。",
        );
      }
    } catch (error) {
      setErrorMessage(
        "バックエンドサーバーと通信できません。起動しているか確認してください。",
      );
    }
  };

  // 【機能2】業務を開始するボタンを押したときの処理（画面切り替え制御）
  const handleStartFocus = async () => {
    try {
      // 集中画面用のタスクを1件取得するAPIを呼び出す
      const response = await fetch(`${API_BASE_URL}/focus`);
      if (response.status === 200) {
        const data = await response.json();
        setFocusTask(data); // タスクをセット
        setIsFocusMode(true); // 2枚目の「シングルタスク集中画面」へ遷移
      } else if (response.status === 204) {
        // 未完了タスクが0件の場合の労いメッセージ表示制御
        setFocusTask(null);
        setIsFocusMode(true);
      }
    } catch (error) {
      alert("サーバーとの通信に失敗しました。");
    }
  };

  // 【機能3】完了（できた！）ボタンを押したときの処理
  const handleCompleteTask = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}/complete`, {
        method: "PUT",
      });
      if (response.ok) {
        // 完了更新に成功したら、間髪入れずに次の「今やるべき1つのタスク」を再取得する
        const nextResponse = await fetch(`${API_BASE_URL}/focus`);
        if (nextResponse.status === 200) {
          const data = await nextResponse.json();
          setFocusTask(data);
        } else {
          setFocusTask(null); // 次のタスクが無ければ完了画面に切り替える
        }
      }
    } catch (error) {
      alert("サーバーとの通信に失敗しました。");
    }
  };

  // 【機能4】リセットボタンを押したときの処理（DELETE APIの呼び出し）
  const handleResetAll = async () => {
    if (
      !window.confirm("本当にすべてのタスクデータを削除してリセットしますか？")
    ) {
      return;
    }
    try {
      const response = await fetch(API_BASE_URL, {
        method: "DELETE",
      });
      if (response.ok) {
        setFocusTask(null);
        setIsFocusMode(false); // データを一括削除し、初期状態の「登録画面」へ引き戻す
        alert("すべてのタスクをリセットしました！");
      }
    } catch (error) {
      alert("リセット処理に失敗しました。");
    }
  };

  // ----------------------------------------------------
  // 🖥️ 画面レイアウト（表示制御）
  // ----------------------------------------------------

  // まだ「タスク登録画面（1枚目）」を表示する場合
  if (!isFocusMode) {
    return (
      <div className="container">
        <h1>MonoTask</h1>
        <p className="subtitle">
          「今やるべき1つの事」に全集中！目移りを遮断する業務着手支援システム
        </p>

        {/* エラーメッセージの動的表示（赤字で警告） */}
        {errorMessage && <p className="error-text">{errorMessage}</p>}

        <form onSubmit={handleAddTask} className="task-form">
          <input
            type="text"
            placeholder="タスクを入力してください（例：週次報告書の作成）"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            className="task-input"
          />
          <button type="submit" className="add-button">
            タスク追加
          </button>
        </form>

        <div className="start-container">
          <button onClick={handleStartFocus} className="start-button">
            業務を開始する ➔
          </button>
        </div>
      </div>
    );
  }

  // 2枚目：シングルタスク集中画面のレイアウト
  return (
    <div className="container">
      <h1>MonoTask</h1>
      <p className="subtitle">
        「今やるべき1つの事」に全集中！目移りを遮断する業務着手支援システム
      </p>

      <div className="focus-card">
        {focusTask ? (
          // 【正常時】システムが自動で選んだタスクを画面中央に巨大表示
          <div>
            <p className="focus-label">今やるべきことはこれだけ！</p>
            <h2 className="giant-task-name">{focusTask.taskName}</h2>

            <button
              onClick={() => handleCompleteTask(focusTask.id)}
              className="complete-button"
            >
              完了（できた！）
            </button>
          </div>
        ) : (
          // 【全完了時】未完了タスクが0件になった場合の、達成感を促すメッセージ
          <div className="all-completed-container">
            <span className="celebration-emoji">🎉</span>
            <h2 className="all-completed-text">すべての業務が完了しました！</h2>
            <p className="all-completed-sub">
              お疲れ様でした。ゆっくり休んでくださいね。
            </p>
          </div>
        )}
      </div>

      {/* 画面下のコントロールエリア */}
      <div className="control-footer">
        <button onClick={handleResetAll} className="reset-button">
          🔄 システムをリセット
        </button>
        <button onClick={() => setIsFocusMode(false)} className="back-button">
          ⬅ 登録画面に戻る
        </button>
      </div>
    </div>
  );
} // ← ここでApp関数を綺麗に閉じているので、エラーが完全に消え去ります！

export default App;
