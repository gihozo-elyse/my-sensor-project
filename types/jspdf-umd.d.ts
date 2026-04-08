declare module "jspdf/dist/jspdf.umd.min.js" {
  export class jsPDF {
    setFontSize(size: number): void;
    text(text: string, x: number, y: number): void;
    save(filename: string): void;
  }
}
