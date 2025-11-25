import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { KnowledgeBaseService } from './knowledge-base.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AdminGuard } from '../admin/admin.guard';

@Controller('admin/knowledge-base')
@UseGuards(AuthGuard, AdminGuard)
export class KnowledgeBaseController {
  constructor(private readonly kbService: KnowledgeBaseService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('description') description?: string,
  ) {
    return this.kbService.create(file, description);
  }

  @Get()
  findAll() {
    return this.kbService.findAll();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.kbService.remove(id);
  }
}
