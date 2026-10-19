import Image from "next/image";
export function Brand() {
  return <span className="brand-lockup"><Image src="/assets/riverbay/riverbay-logo.svg" width={356} height={88} alt="Riverbay" priority /><small>Learning portfolios</small></span>;
}
