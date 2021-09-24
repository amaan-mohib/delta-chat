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

const getHeightAndWidth = (file) => {
  return new Promise((resolve) => {
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
};

/** Compress an image blob file */
const finalCompressedBlob = (file, preview, MAX = 256) => {
  return new Promise(async (resolve) => {
    const { height, width } = await getHeightAndWidth(file);
    const widthRatioBlob = await compressImage(
      preview,
      MAX / width,
      width,
      height
    );
    const heightRatioBlob = await compressImage(
      preview,
      MAX / height,
      width,
      height
    );
    const compressedBlob =
      widthRatioBlob.size > heightRatioBlob.size
        ? heightRatioBlob
        : widthRatioBlob;

    const final = compressedBlob.size > file.size ? file : compressedBlob;

    resolve(final);
  });
};

export default finalCompressedBlob;
