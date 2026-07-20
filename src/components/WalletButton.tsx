import type { ReactElement } from "react";
import { Wallet } from "lucide-react";

export function WalletButton(): ReactElement {
  return (
    <button className="wallet-button" type="button">
      <Wallet size={18} />
      <span>Connect Wallet</span>
    </button>
  );
}
