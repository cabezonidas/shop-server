import { config, S3, SES } from "aws-sdk";
import { Stream } from "stream";
import { createTransport, SendMailOptions } from "nodemailer";

export const awsEnUs = {
  incorrect_album_name_one_non_space_character:
    "Album names must contain at least one non-space character.",
  incorrect_album_name_contains_slashes: "Album names cannot contain slashes.",
  album_already_exists: "Album already exists.",
  failed_to_create_album: "There was an error creating your album.",
  failed_to_list_albums: "There was an error listing your albums.",
  failed_to_view_album: "There was an error viewing your album.",
  failed_to_delete_photo: "There was an error deleting your photo.",
  failed_to_delete_album: "There was an error deleting your album.",
};

export const awsEsAr = {
  incorrect_album_name_one_non_space_character:
    "El nombre del álbum tiene que tener al menos un caracter no espacial.",
  incorrect_album_name_contains_slashes: "Nombres de álbum no pueden contener barras.",
  album_already_exists: "Álbum ya existe.",
  failed_to_create_album: "Hubo un error al crear tu álbum.",
  failed_to_list_albums: "Hubo un error al listar tus álbumes.",
  failed_to_view_album: "Hubo un error al ver tu álbum.",
  failed_to_delete_photo: "Hubo un error al eliminar tu foto.",
  failed_to_delete_album: "Hubo un error al eliminar tu álbum.",
};

const albumBucketName =
  process.env.NODE_ENV === "production" ? "cabezonidas-shop-photos" : "img.javascript.kiwi";
const bucketRegion = "us-east-1";

config.update({
  region: bucketRegion,
  accessKeyId: process.env.MEDIA_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.MEDIA_AWS_SECRET_ACCESS_KEY,
});

const s3 = new S3({
  apiVersion: "2006-03-01",
  params: { Bucket: albumBucketName },
});

export const awsCreateAlbum = (
  albumName: string
): Promise<{ succeed: boolean; error?: string; albumKey: string }> =>
  new Promise(resolve => {
    albumName = albumName.trim();
    if (!albumName) {
      return resolve({
        succeed: false,
        error: "errors.aws.incorrect_album_name_one_non_space_character",
        albumKey: "",
      });
    }
    if (albumName.indexOf("/") !== -1) {
      return resolve({
        succeed: false,
        error: "errors.aws.incorrect_album_name_contains_slashes",
        albumKey: "",
      });
    }
    const albumKey = albumName + "/";
    s3.headObject({ Key: albumKey } as any, (err1, _) => {
      if (!err1) {
        return resolve({
          succeed: false,
          error: "errors.aws.album_already_exists",
          albumKey: "",
        });
      }
      if (err1.code !== "NotFound") {
        return resolve({
          succeed: false,
          error: "errors.aws.failed_to_create_album",
          albumKey: "",
        });
      }
      s3.putObject({ Key: albumKey } as any, (err2, __) => {
        if (err2) {
          return resolve({
            succeed: false,
            error: "errors.aws.failed_to_create_album",
            albumKey: "",
          });
        }

        return resolve({ succeed: true, albumKey: albumName });
      });
    });
  });

export const awsListAlbums = async (): Promise<{
  success: boolean;
  error?: string;
  data: string[];
}> =>
  new Promise(resolve => {
    s3.listObjects({ Delimiter: "/" } as any, (err, data) => {
      if (err) {
        resolve({ success: false, data: [], error: "errors.aws.failed_to_list_albums" });
      } else {
        const albums = data.CommonPrefixes.map(commonPrefix => {
          const prefix = commonPrefix.Prefix;
          return prefix.replace("/", "");
        });
        resolve({ success: true, data: albums });
      }
    });
  });

export const awsAddPhoto = async (albumName: string, fileName: string, file: Stream) => {
  const albumPhotosKey = albumName + "/";

  const photoKey = albumPhotosKey + decodeURIComponent(fileName);

  const upload = new S3.ManagedUpload({
    params: {
      Bucket: albumBucketName,
      Key: photoKey,
      Body: file,
      ACL: "public-read",
    },
  });

  const result = await upload.promise();
  return {
    photoKey: result.Key,
    name: fileName,
    photoUrl: result.Location,
  };
};

export const awsViewAlbum = async (
  albumName: string
): Promise<{
  succeed: boolean;
  error?: string;
  photos: Array<{ photoKey: string; photoUrl: string; name: string }>;
}> =>
  new Promise(resolve => {
    {
      const albumPhotosKey = albumName + "/";
      s3.listObjects({ Prefix: albumPhotosKey } as any, (err, data) => {
        if (err) {
          return resolve({
            succeed: false,
            error: "errors.aws.failed_to_view_album",
            photos: [],
          });
        }
        const bucketUrl = `https://${albumBucketName}.s3.amazonaws.com/`;

        const photos = data.Contents.map(photo => ({
          photoKey: photo.Key,
          photoUrl: bucketUrl + photo.Key,
          name: photo.Key.replace(albumPhotosKey, ""),
        })).filter(p => !!p.name);
        return resolve({ succeed: true, photos });
      });
    }
  });

export const awsDeletePhoto = async (
  photoKey: string
): Promise<{ succeed: boolean; error?: string }> =>
  new Promise(resolve => {
    {
      s3.deleteObject({ Key: photoKey } as any, (err, _) => {
        if (err) {
          return resolve({
            succeed: false,
            error: "errors.aws.failed_to_delete_photo",
          });
        }
        return resolve({ succeed: true });
      });
    }
  });

export const awsDeleteAlbum = async (
  albumName: string
): Promise<{ succeed: boolean; error?: string }> =>
  new Promise(resolve => {
    const albumKey = albumName + "/";
    s3.listObjects({ Prefix: albumKey } as any, (err, data) => {
      if (err) {
        return resolve({
          succeed: false,
          error: "errors.aws.failed_to_delete_album",
        });
      }
      const objects = data.Contents.map(object => {
        return { Key: object.Key };
      });
      s3.deleteObjects(
        {
          Delete: { Objects: objects, Quiet: true },
        } as any,
        (err2, _) => {
          if (err2) {
            return resolve({
              succeed: false,
              error: "errors.aws.failed_to_delete_album",
            });
          }
          return resolve({ succeed: true });
        }
      );
    });
  });

export const sendMail = ({ subject, ...otherProps }: Omit<SendMailOptions, "from">) => {
  const transporter = createTransport({
    SES: new SES({
      apiVersion: "2010-12-01",
    }),
  });

  return transporter.sendMail({
    sender: "Hernan Alvarado",
    from:
      process.env.NODE_ENV === "production"
        ? "hernan@lataminvestingclub.com"
        : "test@lataminvestingclub.awsapps.com",
    subject: process.env.NODE_ENV === "production" ? subject : `[TEST] ${subject}`,
    ...otherProps,
  });
};
