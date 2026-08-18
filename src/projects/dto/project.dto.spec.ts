import { Test, TestingModule } from '@nestjs/testing';
import { CreateProjectDto } from './create-project.dto';
import { AddYoutubeVideoDto } from './add-youtube-video.dto';

describe('Project DTOs', () => {
  describe('CreateProjectDto', () => {
    it('should be defined', () => {
      const dto = new CreateProjectDto();
      expect(dto).toBeDefined();
    });
  });

  describe('AddYoutubeVideoDto', () => {
    it('should be defined', () => {
      const dto = new AddYoutubeVideoDto();
      expect(dto).toBeDefined();
    });
  });
});
