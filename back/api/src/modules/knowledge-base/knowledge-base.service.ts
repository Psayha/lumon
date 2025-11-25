import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KnowledgeBase } from '../../entities/knowledge-base.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KnowledgeBaseService {
  constructor(
    @InjectRepository(KnowledgeBase)
    private kbRepository: Repository<KnowledgeBase>,
    private configService: ConfigService,
  ) {}

  async create(file: Express.Multer.File, description?: string): Promise<KnowledgeBase> {
    // TODO: Implement actual file upload to S3/Local and Vectorization
    // For now, we simulate the process
    
    const kb = this.kbRepository.create({
      name: file.originalname,
      description,
      file_path: `uploads/${file.originalname}`, // Placeholder
      file_type: file.mimetype,
      status: 'pending',
    });

    const savedKb = await this.kbRepository.save(kb);

    // Simulate async processing
    this.processFile(savedKb.id);

    return savedKb;
  }

  async findAll(): Promise<KnowledgeBase[]> {
    return this.kbRepository.find({ order: { created_at: 'DESC' } });
  }

  async remove(id: string): Promise<void> {
    await this.kbRepository.delete(id);
  }

  private async processFile(id: string) {
    // Simulate processing delay
    setTimeout(async () => {
      await this.kbRepository.update(id, { 
        status: 'processed',
        vector_id: `vec_${Math.random().toString(36).substring(7)}`
      });
    }, 2000);
  }
}
