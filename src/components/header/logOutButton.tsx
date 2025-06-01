import { signOut } from "../../lib/auth";

export default function LogOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button type="submit" className="bg-[#808080] text-[#ffffff]  w-full">
        ログアウト
      </button>
    </form>
  );
};
