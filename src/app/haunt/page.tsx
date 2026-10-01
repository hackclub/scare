import { redirect } from "next/navigation";

/** The old dashboard URL; the platform lives at /platform now. */
export default function Haunt() {
  redirect("/platform");
}
