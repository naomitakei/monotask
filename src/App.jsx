import React, { useState } from "react";
import "./App.css";

// バックエンド（Spring Boot）のURLを設定
const API_BASE_URL = "http://localhost:8080/api/tasks";
const LOGIN_API_URL = "http://localhost:8080/api/login";

function App() {
  // --- 【新規】認証（ログイン）状態を管理する変数 ---
  const [isLoggedIn, setIsLoggedIn] = useState(false); // ログイン状態フラグ
  const [username, setUsername] = useState(""); // ログイン入力：ユーザー名
  const [password, setPassword] = useState(""); // ログイン入力：パスワード
  const [loginError, setLoginError] = useState(""); // ログイン用エラー

  // --- タスク管理用の変数 ---
  const [taskName, setTaskName] = useState(""); // 入力欄の文字
  const [errorMessage, setErrorMessage] = useState(""); // タスク用エラーメッセージ
  const [isFocusMode, setIsFocusMode] = useState(false); // 集中画面への切り替えフラグ
  const [focusTask, setFocusTask] = useState(null); // 今やるべき1つのタスク

  // ----------------------------------------------------
  // 🔐 【新規】ログインボタンを押したときの処理
  // ----------------------------------------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");

    // 入力チェック
    if (!username.trim() || !password.trim()) {
      setLoginError("ユーザー名とパスワードを入力してください。");
      return;
    }

    try {
      // Spring BootのログインAPIを呼び出す
      const response = await fetch(LOGIN_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        setIsLoggedIn(true); // ログイン成功！タスク画面へのアクセスを許可
      } else {
        setLoginError("ユーザー名またはパスワードが違います。");
      }
    } catch (error) {
      setLoginError(
        "バックエンドサーバーと通信できません。起動を確認してください。",
      );
    }
  };

  //  ログアウト処理
  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsFocusMode(false);
    setUsername("");
    setPassword("");
    setLoginError("");
  };

  // ----------------------------------------------------
  // 🛠️ タスク管理用の通信処理・イベント
  // ----------------------------------------------------
  const handleAddTask = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!taskName.trim()) {
      setErrorMessage("「タスク内容を入力してください。」");
      return;
    }
    if (taskName.length > 100) {
      setErrorMessage("「タスク内容は100文字以内で入力してください。」");
      return;
    }

    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskName: taskName }),
      });

      if (response.ok) {
        setTaskName("");
        alert("タスクを追加しました！");
      } else {
        setErrorMessage("登録に失敗しました。");
      }
    } catch (error) {
      setErrorMessage("サーバーと通信できません。");
    }
  };

  const handleStartFocus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/focus`);
      if (response.status === 200) {
        const data = await response.json();
        setFocusTask(data);
        setIsFocusMode(true);
      } else if (response.status === 204) {
        setFocusTask(null);
        setIsFocusMode(true);
      }
    } catch (error) {
      alert("サーバーとの通信に失敗しました。");
    }
  };

  const handleCompleteTask = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}/complete`, {
        method: "PUT",
      });
      if (response.ok) {
        const nextResponse = await fetch(`${API_BASE_URL}/focus`);
        if (nextResponse.status === 200) {
          const data = await nextResponse.json();
          setFocusTask(data);
        } else {
          setFocusTask(null);
        }
      }
    } catch (error) {
      alert("サーバーとの通信に失敗しました。");
    }
  };

  const handleResetAll = async () => {
    if (
      !window.confirm("本当にすべてのタスクデータを削除してリセットしますか？")
    )
      return;
    try {
      const response = await fetch(API_BASE_URL, { method: "DELETE" });
      if (response.ok) {
        setFocusTask(null);
        setIsFocusMode(false);
        alert("すべてのタスクをリセットしました！");
      }
    } catch (error) {
      alert("リセット処理に失敗しました。");
    }
  };

  // ----------------------------------------------------
  // 🖥️ 画面表示の切り替え制御（ルーティング制御）
  // ----------------------------------------------------

  // 🔏 パターン0：まだログインしていない場合（アクセス制御要件）
  if (!isLoggedIn) {
    return (
      <div className="container">
        <h1>MonoTask</h1>
        <p className="subtitle">業務着手支援システム（ログイン）</p>

        {loginError && <p className="error-text">{loginError}</p>}

        <form onSubmit={handleLogin} className="login-form">
          <input
            type="text"
            placeholder="ユーザー名（admin）"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="task-input"
          />
          <input
            type="password"
            placeholder="パスワード（1234）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="task-input"
          />
          <button
            type="submit"
            className="start-button"
            style={{ width: "100%", marginTop: "10px" }}
          >
            ログイン
          </button>
        </form>
        <p style={{ fontSize: "0.8rem", color: "#999", marginTop: "20px" }}>
          ※デモ用アカウント: admin / 1234
        </p>
      </div>
    );
  }

  // 🟢 パターン1：ログイン済み ＆ まだ「タスク登録画面」を表示する場合
  if (!isFocusMode) {
    return (
      <div className="container">
        <div style={{ textAlign: "right" }}>
          <button
            onClick={handleLogout}
            className="back-button"
            style={{ color: "#e53e3e" }}
          >
            🚪 ログアウト
          </button>
        </div>
        <h1>MonoTask</h1>
        <p className="subtitle">
          「今やるべき1つの事」に全集中！目移りを遮断する業務着手支援システム
        </p>

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

  // 🔵 パターン2：ログイン済み ＆ 「シングルタスク集中画面」を表示する場合
  return (
    <div className="container">
      <h1>MonoTask</h1>
      <p className="subtitle">
        「今やるべき1つの事」に全集中！目移りを遮断する業務着手支援システム
      </p>

      <div className="focus-card">
        {focusTask ? (
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
          <div className="all-completed-container">
            <span className="celebration-emoji">🎉</span>
            <h2 className="all-completed-text">すべての業務が完了しました！</h2>
            <p className="all-completed-sub">
              お疲れ様でした。ゆっくり休んでくださいね。
            </p>
          </div>
        )}
      </div>

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
}

export default App;
