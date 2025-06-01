import { signIn } from "../../lib/auth";
import Image from "next/image";

export default function LoginButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google", { redirectTo: "/game" });
      }}
    >
      <button type="submit" className="w-fit">
        <Image
          src="login.svg"
          alt="google"
          width={200}
          height={40}
          className="rounded-full"
        ></Image>
      </button>
    </form>
  );
}
