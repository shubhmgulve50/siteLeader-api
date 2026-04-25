const imageExtensions = ['.jpg', '.jpeg', '.png'];
const imageTypes = ['image/jpeg', 'image/png'];

export const S3Upload = {
  allowedDocumentFileExtensions: ['.pdf', ...imageExtensions],
  allowedDocumentFileTypes: ['application/pdf', ...imageTypes],
  minimumDocumentCount: 0,

  allowedImageFileExtensions: [...imageExtensions],
  allowedImageFileTypes: [...imageTypes],

  documentsDir: (userId) => `users/${userId}/documents`,
  biodataPath: (userId) => `users/${userId}/biodata`,
  profilePictureDir: (userId) => `users/${userId}/profile-pictures`,
};
