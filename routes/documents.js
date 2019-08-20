const express = require("express");
const router = express.Router();
const bwipjs = require("bwip-js");
const axios = require("axios");
const logger = require("../lib/logger");
const { DataJsonValidationError, InternalError } = require("../lib/errors");
const formatElectronicDocument = require('../lib/formatElectronicDocument');

function isEmpty(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) return false;
  }
  return true;
}

const imageCreator = params => {
  return new Promise((resolve, reject) => {
    logger.info(params);
    bwipjs.toBuffer(
      {
        bcid: "qrcode",
        text: params,
        includetext: true,
        parse: true,
        height: 60,
        width: 60,
        eclevel: "Q",
        includetext: true,
        textxalign: "center"
      },
      function(err, png) {
        if (err) {
          reject(err);
        } else {
          // `png` is a Buffer
          // png.length           : PNG file length
          // png.readUInt32BE(16) : PNG image width
          // png.readUInt32BE(20) : PNG image height
          resolve(png);
        }
      }
    );
  });
};

/* GET users listing. */
router.get("/", async function(req, res, next) {
  try {
    logger.info(req.body);
    // check if data json is being sent
    if (!req.body || isEmpty(req.body)) {
      throw new Error("Debe enviar la data en formato json del comprobante");
    }
    // get url from env file
    const urlValidation = process.env.URL_DOCUMENT_VALIDATION;
    console.log(urlValidation);
    // get hash code from another service
    const jsonData = JSON.parse(JSON.stringify(req.body));
    // let's format and clear those fields from UBL 2.1
    const jsonDataFormated = formatElectronicDocument(jsonData);
    // prepare the request
    let codigoHashRequest;
    try {
      codigoHashRequest = await axios({
        method: "post",
        url: urlValidation,
        responseType: "json",
        data: jsonData
      });
    } catch (error) {
      const { response } = error;
      if (!response) {
        throw new InternalError(error, 500);
      }
      const { data } = response;
      logger.error(data);
      const errors =
        data && data.errors ? JSON.parse(JSON.stringify(data.errors)) : data;
      throw new DataJsonValidationError(
        "Hubo un error al validar la DATA json.",
        errors,
        400
      );
    }

    const response = codigoHashRequest.data;
    if (!response || !response.data) {
      throw new InternalError(
        "No se pudo obtener el código hash del comprobante, intente nuevamente en unos minutos.",
        500
      );
    }
    const codigoHash = response.data.codigoHash;
    const numDocEmisor = jsonData.documento.numDocEmisor;
    const tipoDocumento = jsonData.tipoDocumento;
    const serie = jsonData.documento.serie;
    const correlativo = jsonData.documento.correlativo;
    const mntTotalIgv = jsonData.documento.mntTotalIgv;
    const mntTotal = jsonData.documento.mntTotal;
    const fechaEmision = jsonData.fechaEmision;
    const tipoDocReceptor = jsonData.documento.tipoDocReceptor;
    const numDocReceptor = jsonData.documento.numDocReceptor;
    // lets build the string to be converted into a QR image
    const strToConvert = `${numDocEmisor}|${tipoDocumento}|${serie}|${correlativo}|${mntTotalIgv}|${mntTotal}|${fechaEmision}|${tipoDocReceptor}|${numDocReceptor}|${codigoHash}`;
    const image = await imageCreator(strToConvert);

    // image is a buffer
    const responseString = Buffer.from(image).toString("base64");
    const successMessage = `La imagen se generó correctamente y pesa: ${image.length}`;
    logger.info(successMessage);
    return res.json({
      data: responseString,
      message: successMessage
    });
  } catch (error) {
    logger.info(error.message);
    return next(error);
  }
});

module.exports = router;
