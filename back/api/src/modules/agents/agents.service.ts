import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from '@entities';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AgentsService {
  private openai!: OpenAI;

  constructor(
    @InjectRepository(Agent)
    private agentRepository: Repository<Agent>,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('app.openai.apiKey');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async create(createAgentDto: CreateAgentDto): Promise<Agent> {
    if (createAgentDto.is_default) {
      // Ensure only one default agent exists
      await this.agentRepository.update({ is_default: true }, { is_default: false });
    }
    const agent = this.agentRepository.create(createAgentDto);
    return this.agentRepository.save(agent);
  }

  async findAll(): Promise<Agent[]> {
    return this.agentRepository.find({ order: { created_at: 'DESC' } });
  }

  async findOne(id: string): Promise<Agent> {
    const agent = await this.agentRepository.findOne({ where: { id } });
    if (!agent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }
    return agent;
  }

  async update(id: string, updateAgentDto: UpdateAgentDto): Promise<Agent> {
    if (updateAgentDto.is_default) {
      // Ensure only one default agent exists
      await this.agentRepository.update({ is_default: true }, { is_default: false });
    }
    await this.agentRepository.update(id, updateAgentDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.agentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }
  }

  async generateResponse(agentId: string, messages: any[]): Promise<string> {
    const agent = await this.findOne(agentId);
    
    if (!this.openai) {
        // Try to re-initialize if key was added later
        const apiKey = this.configService.get<string>('app.openai.apiKey');
        if (apiKey) {
            this.openai = new OpenAI({ apiKey });
        } else {
            throw new Error('OpenAI API key not configured');
        }
    }

    const systemMessage = agent.system_prompt 
      ? { role: 'system', content: agent.system_prompt } 
      : null;

    const completion = await this.openai.chat.completions.create({
      messages: systemMessage ? [systemMessage, ...messages] : messages,
      model: agent.model,
      temperature: agent.temperature,
    });

    return completion.choices[0].message.content || '';
  }

  async getDefaultAgent(): Promise<Agent | null> {
    return this.agentRepository.findOne({ where: { is_default: true } });
  }
}
