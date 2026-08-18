import { Redirect } from "expo-router";
export default function StaffHome() {
  return <Redirect href={"/(staff)/tasks" as never} />;
}
