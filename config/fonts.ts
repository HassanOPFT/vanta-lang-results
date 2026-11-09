import { Figtree, IBM_Plex_Mono } from "next/font/google";

export const fontSans = Figtree({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});
