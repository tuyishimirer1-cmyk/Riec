import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { FilterPropertyDto } from './dto/filter-property.dto';
import { PropertyInquiryDto, PropertyViewingDto } from './dto/property-inquiry.dto';

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  // Generate unique slug from title
  private async generateSlug(title: string): Promise<string> {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = baseSlug;
    let counter = 1;

    while (await this.prisma.property.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  // CREATE - Submit new property (authenticated user)
  async create(createPropertyDto: CreatePropertyDto, userId: string) {
    const slug = await this.generateSlug(createPropertyDto.title);

    const property = await this.prisma.property.create({
      data: {
        ...createPropertyDto,
        slug,
        sellerId: userId,
        status: 'DRAFT',
        verificationStatus: 'NOT_VERIFIED',
        currency: createPropertyDto.currency || 'RWF',
      },
      include: {
        seller: {
          select: { id: true, email: true, role: true },
        },
      },
    });

    return property;
  }

  // READ - Get all verified properties (public)
  async findAll(filterDto: FilterPropertyDto) {
    const {
      search,
      propertyType,
      listingType,
      district,
      sector,
      minPrice,
      maxPrice,
      minLandSize,
      maxLandSize,
      bedrooms,
      bathrooms,
      verifiedOnly = true,
      featuredOnly,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto;

    const where: any = {
      status: 'PUBLISHED',
    };

    if (verifiedOnly) {
      where.verificationStatus = 'VERIFIED';
    }

    if (featuredOnly) {
      where.isFeatured = true;
      where.featuredUntil = { gte: new Date() };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { district: { contains: search, mode: 'insensitive' } },
        { sector: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (propertyType) where.propertyType = propertyType;
    if (listingType) where.listingType = listingType;
    if (district) where.district = district;
    if (sector) where.sector = sector;

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (minLandSize !== undefined || maxLandSize !== undefined) {
      where.landSize = {};
      if (minLandSize !== undefined) where.landSize.gte = minLandSize;
      if (maxLandSize !== undefined) where.landSize.lte = maxLandSize;
    }

    if (bedrooms !== undefined) where.bedrooms = bedrooms;
    if (bathrooms !== undefined) where.bathrooms = bathrooms;

    const skip = (page - 1) * limit;

    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          images: {
            orderBy: { order: 'asc' },
            take: 1,
          },
          _count: {
            select: {
              favorites: true,
              inquiries: true,
            },
          },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    return {
      data: properties,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // READ - Get featured properties
  async findFeatured(limit: number = 8) {
    return this.prisma.property.findMany({
      where: {
        status: 'PUBLISHED',
        verificationStatus: 'VERIFIED',
        isFeatured: true,
        featuredUntil: { gte: new Date() },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        images: {
          orderBy: { order: 'asc' },
          take: 1,
        },
      },
    });
  }

  // READ - Get property by slug (public)
  async findOneBySlug(slug: string) {
    const property = await this.prisma.property.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { order: 'asc' } },
        videos: { orderBy: { order: 'asc' } },
        seller: {
          select: { id: true, email: true },
        },
        _count: {
          select: {
            favorites: true,
            inquiries: true,
            viewings: true,
          },
        },
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.status !== 'PUBLISHED' && property.verificationStatus !== 'VERIFIED') {
      throw new ForbiddenException('Property is not available');
    }

    // Increment view count
    await this.prisma.property.update({
      where: { id: property.id },
      data: { viewCount: { increment: 1 } },
    });

    return property;
  }

  // READ - Get user's own properties
  async findMyProperties(userId: string) {
    return this.prisma.property.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        images: {
          orderBy: { order: 'asc' },
          take: 1,
        },
        _count: {
          select: {
            favorites: true,
            inquiries: true,
            viewings: true,
          },
        },
      },
    });
  }

  // UPDATE - Update own property
  async update(id: string, updatePropertyDto: UpdatePropertyDto, userId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.sellerId !== userId) {
      throw new ForbiddenException('You can only update your own properties');
    }

    // If title changed, regenerate slug
    let slug = property.slug;
    if (updatePropertyDto.title && updatePropertyDto.title !== property.title) {
      slug = await this.generateSlug(updatePropertyDto.title);
    }

    return this.prisma.property.update({
      where: { id },
      data: {
        ...updatePropertyDto,
        slug,
        updatedAt: new Date(),
      },
      include: {
        images: true,
        videos: true,
      },
    });
  }

  // DELETE - Delete own property
  async remove(id: string, userId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.sellerId !== userId) {
      throw new ForbiddenException('You can only delete your own properties');
    }

    await this.prisma.property.delete({ where: { id } });

    return { message: 'Property deleted successfully' };
  }

  // FAVORITE - Toggle favorite
  async toggleFavorite(propertyId: string, userId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const existing = await this.prisma.propertyFavorite.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
    });

    if (existing) {
      await this.prisma.propertyFavorite.delete({
        where: { id: existing.id },
      });
      return { message: 'Property removed from favorites', isFavorited: false };
    } else {
      await this.prisma.propertyFavorite.create({
        data: { userId, propertyId },
      });
      return { message: 'Property added to favorites', isFavorited: true };
    }
  }

  // FAVORITE - Get user favorites
  async findFavorites(userId: string) {
    const favorites = await this.prisma.propertyFavorite.findMany({
      where: { userId },
      include: {
        property: {
          include: {
            images: {
              orderBy: { order: 'asc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map((fav) => fav.property);
  }

  // INQUIRY - Submit inquiry (contact seller)
  async createInquiry(propertyId: string, inquiryDto: PropertyInquiryDto, userId?: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return this.prisma.propertyInquiry.create({
      data: {
        propertyId,
        userId,
        ...inquiryDto,
        status: 'NEW',
      },
    });
  }

  // VIEWING - Request property viewing
  async createViewing(propertyId: string, viewingDto: PropertyViewingDto, userId?: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return this.prisma.propertyViewing.create({
      data: {
        propertyId,
        userId,
        preferredDate: new Date(viewingDto.preferredDate),
        preferredTime: viewingDto.preferredTime,
        name: viewingDto.name,
        email: viewingDto.email,
        phone: viewingDto.phone,
        message: viewingDto.message,
        status: 'PENDING',
      },
    });
  }

  // ==================== ADMIN METHODS ====================

  // ADMIN - Get all properties (any status)
  async findAllAdmin(filterDto: FilterPropertyDto) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = filterDto;
    const skip = (page - 1) * limit;

    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          seller: {
            select: { id: true, email: true, role: true },
          },
          images: {
            orderBy: { order: 'asc' },
            take: 1,
          },
          _count: {
            select: {
              favorites: true,
              inquiries: true,
              viewings: true,
            },
          },
        },
      }),
      this.prisma.property.count(),
    ]);

    return {
      data: properties,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ADMIN - Get pending verification properties
  async findPendingVerification() {
    return this.prisma.property.findMany({
      where: {
        status: 'PENDING_REVIEW',
        verificationStatus: 'PENDING',
      },
      orderBy: { createdAt: 'asc' },
      include: {
        seller: {
          select: { id: true, email: true, role: true },
        },
        images: { orderBy: { order: 'asc' } },
        documents: true,
      },
    });
  }

  // ADMIN - Verify property
  async verifyProperty(id: string, adminId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return this.prisma.property.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedById: adminId,
        publishedAt: new Date(),
      },
    });
  }

  // ADMIN - Reject property
  async rejectProperty(id: string, reason: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return this.prisma.property.update({
      where: { id },
      data: {
        status: 'REJECTED',
        verificationStatus: 'REJECTED',
        rejectionReason: reason,
      },
    });
  }

  // ADMIN - Toggle featured
  async toggleFeatured(id: string, featuredUntil?: Date) {
    const property = await this.prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return this.prisma.property.update({
      where: { id },
      data: {
        isFeatured: !property.isFeatured,
        featuredUntil: featuredUntil || (property.isFeatured ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days default
      },
    });
  }

  // ADMIN - Get all inquiries
  async findAllInquiries() {
    return this.prisma.propertyInquiry.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        property: {
          select: { id: true, title: true, slug: true },
        },
        user: {
          select: { id: true, email: true },
        },
      },
    });
  }

  // ADMIN - Get all viewings
  async findAllViewings() {
    return this.prisma.propertyViewing.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        property: {
          select: { id: true, title: true, slug: true },
        },
        user: {
          select: { id: true, email: true },
        },
      },
    });
  }

  // ADMIN - Update viewing status
  async updateViewingStatus(id: string, status: 'APPROVED' | 'REJECTED' | 'COMPLETED', adminNotes?: string) {
    return this.prisma.propertyViewing.update({
      where: { id },
      data: { status, adminNotes },
    });
  }

  // STATS - Get statistics
  async getStats() {
    const [
      total,
      pending,
      verified,
      rejected,
      published,
      featured,
      totalInquiries,
      totalViewings,
    ] = await Promise.all([
      this.prisma.property.count(),
      this.prisma.property.count({ where: { status: 'PENDING_REVIEW' } }),
      this.prisma.property.count({ where: { verificationStatus: 'VERIFIED' } }),
      this.prisma.property.count({ where: { status: 'REJECTED' } }),
      this.prisma.property.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.property.count({ where: { isFeatured: true } }),
      this.prisma.propertyInquiry.count(),
      this.prisma.propertyViewing.count(),
    ]);

    return {
      total,
      pending,
      verified,
      rejected,
      published,
      featured,
      totalInquiries,
      totalViewings,
    };
  }
}
