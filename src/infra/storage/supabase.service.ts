import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!,
    );
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'products',
  ): Promise<string> {
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${folder}/${createId()}.${fileExt}`;

    const { data, error } = await this.supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error('Supabase Upload Error: ', error);
      throw new InternalServerErrorException(
        'Failed to upload image to storage',
      );
    }

    const {
      data: { publicUrl },
    } = this.supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .getPublicUrl(data.path);

    return publicUrl;
  }

  async deleteImages(urls: string[]): Promise<void> {
    if (urls.length === 0) return;

    const paths = urls.map((url) => {
      const parts = url.split('/');
      return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
    });

    const { error } = await this.supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .remove(paths);

    if (error) {
      console.error('Supabase Delete Error: ', error);
      throw new InternalServerErrorException(
        'Failed to delete images from storage',
      );
    }
  }
}
