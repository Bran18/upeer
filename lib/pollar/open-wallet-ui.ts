type OpenWalletUiInput = {
  isAuthenticated: boolean;
  openLoginModal: () => void;
  openWalletBalanceModal: () => void;
};

/** Opens Pollar wallet UI when signed in; login otherwise. */
export function openPollarWalletUi(pollar: OpenWalletUiInput): void {
  if (pollar.isAuthenticated) {
    pollar.openWalletBalanceModal();
    return;
  }
  pollar.openLoginModal();
}
