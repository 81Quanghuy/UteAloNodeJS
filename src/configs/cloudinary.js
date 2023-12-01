const cloudinary = require("cloudinary");

cloudinary.config({
  cloud_name: "ddccjvlbf",
  api_key: "135792485217745",
  api_secret: "6XXhPgTw6dZ3x7d43S_x5tIF7oU",
});

// console.log("Cloudinary Configuration:", cloudinary.config().cloud_name);
// console.log("Cloudinary Configuration:", cloudinary.config().api_key);
// console.log("Cloudinary Configuration:", cloudinary.config().api_secret);

// Hàm tải ảnh lên Cloudinary
exports.uploadImage = async (imageFile) => {
  console.log("imageFile", imageFile);
  try {
    const result = await cloudinary.uploader.upload(imageFile, {
      folder: "posts", // Thay đổi theo cấu trúc thư mục của bạn
      allowed_formats: ["jpg", "jpeg", "png"], // Định dạng ảnh được phép
      // Các tùy chọn khác tại đây
    });

    return result.secure_url; // Trả về URL của ảnh đã tải lên
  } catch (error) {
    throw new Error("Failed to upload image to Cloudinary");
  }
};

// Hàm tải file lên Cloudinary
exports.uploadFile = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: "files", // Thay đổi theo cấu trúc thư mục của bạn
      resource_type: "auto", // Loại tài nguyên (auto hoặc raw)
      // Các tùy chọn khác tại đây
    });

    return result.secure_url; // Trả về URL của file đã tải lên
  } catch (error) {
    throw new Error("Failed to upload file to Cloudinary");
  }
};

// // Hàm kiểm tra kết nối và tải ảnh lên Cloudinary
// const testCloudinaryConnection = async () => {
//   try {
//     const testImageFilePath = "../../src/1.jpeg"; // Thay đổi đường dẫn tới hình ảnh

//     const imageUrl = await uploadImage(testImageFilePath);
//     console.log("Uploaded image URL:", imageUrl);
//   } catch (error) {
//     console.error("Failed to upload image to Cloudinary:", error);
//   }
// };

// // Gọi hàm kiểm tra kết nối và tải ảnh lên Cloudinary
// testCloudinaryConnection();
