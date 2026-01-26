export const snapStatusMapping: { [key: string]: string } = {
    challenge: "Menunggu Konfirmasi",
    success: "Sudah Dibayar",
    settlement: "Sudah Dibayar",
    pending: "Menunggu Konfirmasi",
    deny: "Gagal",
    cancel: "Dibatalkan",
    expire: "Kadaluarsa",
    failure: "Gagal",
};

export const formatStatus = (status: string) => {
    if (!status) return "Pending";
    const lowerStatus = status.toLowerCase();
    return snapStatusMapping[lowerStatus] || status.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};
