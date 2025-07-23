export interface Testimonial {
  quote: string;
  name: string;
  title: string;
  avatar: string;
}

export const baseTestimonials: Testimonial[] = [
  {
      quote: "Sofa yang saya beli sangat nyaman dan mengubah total suasana ruang keluarga. Kualitasnya melebihi ekspektasi!",
      name: "Sarah Wijayanti",
      title: "Pemilik Rumah, Jakarta",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d"
  },
  {
      quote: "Proses pembelian sangat mudah dan pengirimannya cepat. Meja makannya pas sekali untuk dapur saya. Terima kasih!",
      name: "Budi Santoso",
      title: "Desainer Interior",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704e"
  },
  {
      quote: "Layanan pelanggannya sangat responsif. Mereka membantu saya memilih lemari yang tepat. Sangat direkomendasikan.",
      name: "Rina Hartono",
      title: "Pengusaha Kafe, Bandung",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704f"
  }
];
