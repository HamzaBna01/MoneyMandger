import { AuthForm } from "@/components/auth-form";
import { loginAction } from "../actions";

export default function LoginPage() {
  return <AuthForm mode="login" action={loginAction} />;
}
