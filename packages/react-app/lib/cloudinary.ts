export interface UploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
}

export const uploadAvatar = async (
  file: File,
  walletAddress: string
): Promise<UploadResult> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'fx_remit_avatars');
  formData.append('public_id', `avatars/${walletAddress}`);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/dn2ed9k6p/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(`Cloudinary error: ${result.error.message}`);
    }

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getOptimizedAvatarUrl = (publicId: string, size: number = 100): string => {
  return `https://res.cloudinary.com/dn2ed9k6p/image/upload/w_${size},h_${size},c_fill,f_auto,q_auto/${publicId}`;
};
