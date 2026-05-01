import { redirect } from "next/navigation";

/** Hub da área Will: índice não deve “voltar” para a dash (confundia o menu). */
export default function WillIndexPage() {
  redirect("/will/court");
}
