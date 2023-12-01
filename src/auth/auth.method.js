const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const crypto = require("crypto");

const secretKey = crypto.randomBytes(32).toString("hex");

const sign = promisify(jwt.sign).bind(jwt);
const verify = promisify(jwt.verify).bind(jwt);

exports.generateToken = async (payload, tokenLife) => {
  try {
    return await sign(
      {
        payload,
      },
      secretKey,
      {
        algorithm: "HS512",
        expiresIn: tokenLife,
      }
    );
  } catch (error) {
    console.log(`Error in generate access token: ${error}`);
    return null;
  }
};

exports.verifyToken = async (token) => {
  try {
    return await verify(token, secretKey);
  } catch (error) {
    console.log(`Error in verify access token: ${error}`);
    return null;
  }
};

exports.decodeToken = async (token) => {
  try {
    return await verify(token, secretKey, {
      ignoreExpiration: true,
    });
  } catch (error) {
    console.log(`Error in decode access token: ${error}`);
    return null;
  }
};

exports.getUserIdFromJwt = async (token) => {
  try {
    const decodedToken = await verify(token, secretKey);
    return decodedToken.payload.userId;
  } catch (error) {
    console.log(`Error in getUserIdFromJwt: ${error}`);
    return null;
  }
};

exports.getUserIdFromRefreshToken = async (refreshToken) => {
  try {
    const decodedToken = await verify(refreshToken, secretKey);
    return decodedToken.payload.userId;
  } catch (error) {
    console.log(`Error in getUserIdFromRefreshToken: ${error}`);
    return null;
  }
};
