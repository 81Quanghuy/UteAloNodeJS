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

// // Hàm kiểm tra kết nối và tải ảnh lên Cloudinary
// const testCloudinaryConnection = async () => {
//   try {
//     const testImageFilePath = "../../src/1.jpeg"; // Thay đổi đường dẫn tới hình ảnh

//     const imageUrl = await uploadPhotosToCloudinary(testImageFilePath);
//     console.log("Uploaded image URL:", imageUrl);
//   } catch (error) {
//     console.error("Failed to upload image to Cloudinary:", error);
//   }
// };

// // Gọi hàm kiểm tra kết nối và tải ảnh lên Cloudinary
// testCloudinaryConnection();
