/* eslint-disable import/no-extraneous-dependencies */
const cloudinary = require("cloudinary");
// eslint-disable-next-line import/no-unresolved
const sizeOf = require("image-size");

cloudinary.config({
  cloud_name: "ddccjvlbf",
  api_key: "135792485217745",
  api_secret: "6XXhPgTw6dZ3x7d43S_x5tIF7oU",
});

// console.log("Cloudinary Configuration:", cloudinary.config().cloud_name);
// console.log("Cloudinary Configuration:", cloudinary.config().api_key);
// console.log("Cloudinary Configuration:", cloudinary.config().api_secret);

// Hàm tải ảnh lên Cloudinary
exports.uploadPhotosToCloudinary = async (photoBuffer) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        (result) => {
          console.log("result", result);
          resolve(result.secure_url); // Trả về secure_url khi upload thành công
        },
        { resource_type: "image", format: "jpg" }
      )
      .end(photoBuffer, (error) => {
        if (error) {
          reject(new Error("Failed to upload photo to Cloudinary"));
        }
      });
  });

// Xóa ảnh trên Cloudinary
exports.deletePhotoFromCloudinary = async (imageUrl) => {
  console.log(imageUrl);
  const publicId = imageUrl.split("/").pop().split(".")[0]; // Lấy public ID từ URL
  console.log(publicId);
  try {
    console.log("2");
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("3");
    console.log("result", result);
    if (result.result === "ok") {
      console.log("Thành công");
      return true; // Xóa ảnh thành công
    }
    throw new Error("Failed to delete photo from Cloudinary");
  } catch (error) {
    throw new Error("Failed to delete photo from Cloudinary");
  }
};

// Sử dụng hàm để xóa ảnh
// deletePhotoFromCloudinary(
//   "https://res.cloudinary.com/ddccjvlbf/image/upload/v1701535786/dtqg5smrn4wuqbxw9jvh.jpg"
// )
//   .then((success) => {
//     console.log("Photo deletion status:", success ? "Success" : "Failed");
//   })
//   .catch((error) => {
//     console.error("Error deleting photo:", error.message);
//   });

// Hàm tải tệp lên Cloudinary
exports.uploadFilesToCloudinary = async (fileBuffer) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        (result) => {
          console.log("result", result);
          resolve(result.secure_url); // Trả về secure_url khi upload thành công
        },
        { resource_type: "auto" } // resource_type có thể là "image", "video", "raw", hoặc "auto" để phân loại tài nguyên tự động
      )
      .end(fileBuffer, (error) => {
        if (error) {
          reject(new Error("Failed to upload file to Cloudinary"));
        }
      });
  });
