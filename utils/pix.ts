
type PixParams = {
  key: string;               // sua chave PIX (email/celular/aleatória)
  merchantName: string;      // nome do recebedor (máx. 25)
  merchantCity: string;      // cidade (máx. 15)
  amount: number;            // valor em BRL (ex.: 30)
  txid?: string;             // opcional; máx. 25
};

// helper: formata "id + length(2) + value"
function f(id: string, value: string) {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

function crc16(payload: string) {
  // CRC16-CCITT (x^16 + x^12 + x^5 + 1), poly 0x1021
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) crc = (crc << 1) ^ 0x1021;
      else crc <<= 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function buildPixPayload({ key, merchantName, merchantCity, amount, txid }: PixParams) {
  const _name = merchantName.slice(0, 25);
  const _city = merchantCity.slice(0, 15);
  const _amount = amount.toFixed(2);

  // 00: Payload Format Indicator (fixo "01")
  const id00 = f("00", "01");
  // 01: Point of Initiation Method (fixo "12" = dinâmico / valor)
  const id01 = f("01", "12");

  // 26: Merchant Account Information - GUI + chave
  const gui = f("00", "br.gov.bcb.pix");
  const k = f("01", key);
  const id26 = f("26", gui + k);

  // 52: Merchant Category Code (0000)
  const id52 = f("52", "0000");
  // 53: Transaction Currency (986 = BRL)
  const id53 = f("53", "986");
  // 54: Transaction Amount
  const id54 = f("54", _amount);
  // 58: Country Code
  const id58 = f("58", "BR");
  // 59: Merchant Name
  const id59 = f("59", _name);
  // 60: Merchant City
  const id60 = f("60", _city);

  // 62: Additional Data Field (txid opcional; se não tiver, usa "dede")
  const tx = f("05", (txid ?? "dede").slice(0, 25));
  const id62 = f("62", tx);

  // 63: CRC placeholder "6304" + CRC depois
  const base = id00 + id01 + id26 + id52 + id53 + id54 + id58 + id59 + id60 + id62 + "6304";
  const crc = crc16(base);
  return base + crc;
}
