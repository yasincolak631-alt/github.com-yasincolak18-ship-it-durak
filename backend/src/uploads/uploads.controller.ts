import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// NOT: Bu, tek sunuculu bir kurulum için basit bir yerel disk depolama çözümüdür.
// Birden fazla sunucu/konteynerle yatay ölçeklendiğinde (örn. Railway'de birden fazla
// instance) diskteki dosyalar instance'lar arasında paylaşılmaz — bu noktada
// Cloudinary/S3 gibi bir nesne depolama servisine geçmek gerekir (README'de not var).
@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, callback) => {
          const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
          callback(null, uniqueName);
        },
      }),
      limits: { fileSize: MAX_SIZE_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_TYPES.includes(file.mimetype)) {
          callback(new BadRequestException('Sadece JPEG, PNG veya WEBP yüklenebilir'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Dosya bulunamadı');
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    return { url: `${backendUrl}/uploads/${file.filename}` };
  }
}
