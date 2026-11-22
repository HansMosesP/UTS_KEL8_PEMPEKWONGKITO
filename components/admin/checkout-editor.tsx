"use client";

import { DEFAULT_PAYMENTS, DEFAULT_SHIPPING } from "../../lib/defaults";
import { useStore } from "../../lib/store";
import type { PaymentMethod, ShippingCity } from "../../lib/types";
import ListEditor from "./list-editor";

/** Pilihan kota (ongkir) dan metode pembayaran di halaman checkout. */
export default function CheckoutEditor() {
  const { shippingCities, paymentMethods, saveContent } = useStore();
  return (
    <section className="tab-content active">
      <ListEditor<ShippingCity>
        title="Ongkos Kirim per Kota"
        description="Pilihan kota tujuan saat checkout. Ongkir dihitung ulang di server, jadi pelanggan tidak bisa mengubahnya. Pesanan lama tidak ikut berubah."
        itemLabel="Kota"
        items={shippingCities}
        defaults={DEFAULT_SHIPPING}
        minItems={1}
        maxItems={50}
        // NaN = kolom ongkir masih kosong, admin wajib mengisinya.
        blank={() => ({ name: "", fee: Number.NaN })}
        fields={[
          { key: "name", label: "Nama kota / wilayah", required: true, maxLength: 80, placeholder: "Contoh: Jakarta / Bandung" },
          {
            key: "fee",
            label: "Ongkir (Rp)",
            type: "number",
            min: 0,
            max: 10_000_000,
            placeholder: "Contoh: 15000",
            hint: "Isi 0 untuk gratis ongkir.",
          },
        ]}
        onSave={(items) => saveContent("shippingData", items)}
      />
      <ListEditor<PaymentMethod>
        title="Metode Pembayaran"
        description="Pilihan pembayaran saat checkout. Pesanan lama tetap menyimpan nama metode yang dipilih saat itu."
        itemLabel="Metode"
        items={paymentMethods}
        defaults={DEFAULT_PAYMENTS}
        minItems={1}
        maxItems={20}
        blank={() => ({ name: "" })}
        fields={[
          { key: "name", label: "Nama metode", required: true, maxLength: 80, placeholder: "Contoh: Transfer BCA" },
        ]}
        onSave={(items) => saveContent("paymentData", items)}
      />
    </section>
  );
}
