const compressImage = (image, scale, initalWidth, initalHeight) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");

    canvas.width = scale * initalWidth;
    canvas.height = scale * initalHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    ctx.canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/png");
  });
};
export const getHeightAndWidth = (file) =>
  new Promise((resolve) => {
    const dataURL = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        height: img.height,
        width: img.width,
      });
    };
    img.src = dataURL;
  });

export default compressImage;
