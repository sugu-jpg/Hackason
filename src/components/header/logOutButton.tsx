import { signOut } from "../../lib/auth";

export default function LogOutButton() {
  return (
    <>
      <style>
        {`
          .logout-button {
            background: linear-gradient(135deg, #e5e5e5, #cccccc);
            color:  black;
            border: 2px solid #fbbf24;
            border-radius: 8px;
            padding: 8px 16px;
            font-family: 'Anton', sans-serif;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3), 0 0 15px rgba(220, 38, 38, 0.4);
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
            position: relative;
            overflow: hidden;
          }

          .logout-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4), 0 0 20px rgba(220, 38, 38, 0.6);
            border-color: #f59e0b;
          }

          .logout-button:active {
            transform: translateY(0);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 10px rgba(220, 38, 38, 0.4);
          }

          .logout-button::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
            transform: rotate(45deg);
            transition: all 0.5s;
            opacity: 0;
          }

          .logout-button:hover::before {
            animation: shine 0.8s ease-in-out;
          }

          @keyframes shine {
            0% {
              opacity: 0;
              transform: translateX(-100%) translateY(-100%) rotate(45deg);
            }
            50% {
              opacity: 1;
            }
            100% {
              opacity: 0;
              transform: translateX(100%) translateY(100%) rotate(45deg);
            }
          }

          .logout-form {
            margin: 0;
            padding: 0;
          }
        `}
      </style>
      
      <form
        className="logout-form"
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button type="submit" className="logout-button">
          🚪 ログアウト
        </button>
      </form>
    </>
  );
};