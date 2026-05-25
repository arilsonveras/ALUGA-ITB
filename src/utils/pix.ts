/**
 * Simulates a standard Brazilian PIX payload generator (EMV BR Code / QRCodes)
 * For security and offline reliability, it compiles a realistic "Copia e Cola" string.
 */
export function generatePixPayload(key: string, amount: number, referenceId: string, merchantName: string = "ALUGUEL"): string {
  const cleanKey = key.replace(/[\s\-\.\(\)\/]/g, '');
  const amountStr = amount.toFixed(2);
  
  // Format rules for EMV:
  // 00 (Payload Format Indicator) = 000201
  // 26 (Merchant Account Information - Pix) = 
  //    0014BR.GOV.BCB.PIX
  //    01(len)(key)
  const pixKeyPart = `0014BR.GOV.BCB.PIX01${cleanKey.length.toString().padStart(2, '0')}${cleanKey}`;
  const merchantAccountInfo = `26${pixKeyPart.length.toString().padStart(2, '0')}${pixKeyPart}`;
  
  // 52 (Merchant Category Code) = 52040000
  const categoryCode = "52040000";
  // 53 (Transaction Currency) = 5303986 (986 = BRL)
  const currencyCode = "5303986";
  // 54 (Transaction Amount)
  const amountPart = `54${amountStr.length.toString().padStart(2, '0')}${amountStr}`;
  // 58 (Country Code) = 5802BR
  const countryCode = "5802BR";
  // 59 (Merchant Name)
  const cleanMerchant = merchantName.substring(0, 25).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const merchantPart = `59${cleanMerchant.length.toString().padStart(2, '0')}${cleanMerchant}`;
  // 60 (Merchant City) = SAO PAULO
  const cityPart = "6009SAO PAULO";
  // 62 (Additional Data Field Template)
  const txPart = `05${referenceId.length.toString().padStart(2, '0')}${referenceId}`;
  const additionalData = `62${txPart.length.toString().padStart(2, '0')}${txPart}`;
  
  const payloadBase = `000201${merchantAccountInfo}${categoryCode}${currencyCode}${amountPart}${countryCode}${merchantPart}${cityPart}${additionalData}6304`;
  
  // Quick CRC-16 (CCITT) mockup to give it the realistic final 4 characters (e.g., A4B2)
  let crc = 0xFFFF;
  for (let i = 0; i < payloadBase.length; i++) {
    const charCode = payloadBase.charCodeAt(i);
    crc ^= (charCode << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  const crcHex = crc.toString(16).toUpperCase().padStart(4, '0');
  return `${payloadBase}${crcHex}`;
}
