export function getDirectDriveUrl(url: string): string {
  if (!url) return '';
  
  // Handle Google Drive links
  // Standard: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // Direct: https://drive.google.com/uc?export=view&id=FILE_ID
  // Alternative: https://lh3.googleusercontent.com/u/0/d/FILE_ID
  
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^\/]+)/) || 
                     url.match(/drive\.google\.com\/open\?id=([^\/&]+)/) ||
                     url.match(/drive\.google\.com\/uc\?id=([^\/&]+)/);
                     
  if (driveMatch && driveMatch[1]) {
    return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
  }
  
  return url;
}
