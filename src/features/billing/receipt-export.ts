import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { billingService } from "./service";
import { formatDate } from "@/shared/utils/date";
import { formatMoney } from "@/shared/utils/money";

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );
}

export async function shareReceiptPdf(receiptId: string) {
  const detail = await billingService.getReceiptDetails(receiptId);
  const rows = detail.allocations
    .map(
      (allocation) =>
        `<tr><td>${escapeHtml(allocation.invoiceNumber)}</td><td>${escapeHtml(formatMoney(allocation.amountPaise))}</td></tr>`,
    )
    .join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;color:#142f35;padding:32px}h1{font-size:26px}table{width:100%;border-collapse:collapse;margin-top:24px}td,th{padding:10px;border-bottom:1px solid #cfc6b5;text-align:left}.amount{font-size:22px;font-weight:700}</style></head><body><p>TENANTLY</p><h1>Receipt ${escapeHtml(detail.receipt.receipt_number)}</h1><p>Generated ${escapeHtml(formatDate(detail.receipt.generated_at))}</p><p class="amount">${escapeHtml(formatMoney(detail.payment.amount_paise))}</p><p>${escapeHtml(detail.payment.method.replace("_", " "))} · ${escapeHtml(formatDate(detail.payment.paid_on))}</p><table><thead><tr><th>Invoice</th><th>Allocated</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
  const file = await Print.printToFileAsync({ html });
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("sharing_unavailable");
  await Sharing.shareAsync(file.uri, {
    mimeType: "application/pdf",
    dialogTitle: detail.receipt.receipt_number,
  });
}
