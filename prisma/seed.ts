/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import 'dotenv/config';
import {
  PrismaClient,
  ProjectType,
  ProjectCategory,
  Role,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Seed Admin User (in User model)
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: Role.ADMIN,
      },
    });
    console.log('Created admin User:', adminEmail);
  } else {
    console.log('Admin User already exists:', adminEmail);
  }

  // 2. Seed Services (8 rich services with main tasks/process)
  const servicesData = [
    {
      // Service 01 – Land Surveying
      name: 'Land Surveying',
      slug: 'land-surveying',
      shortDescription:
        'Advanced geodetic measurements for precise topographical data.',
      detailedDescription:
        'Advanced geodetic measurements using RTK-GPS and robotic total stations for precise topographical data.',
      order: 1,
      title: 'Land Surveying',
      description:
        'Advanced geodetic measurements using RTK-GPS and robotic total stations for precise topographical data.',
      process:
        'Advanced geodetic measurements using RTK-GPS and robotic total stations for precise topographical data.',
      mainTasks: [
        {
          title: '3D Modeling',
          description: 'Advanced digital plans for precision development.',
        },
        {
          title: 'Sustainability',
          description: 'Eco-friendly solutions for green infrastructure.',
        },
        {
          title: 'Urban Planning',
          description: 'Strategic city layouts for future growth.',
        },
      ],
    },
    {
      // Service 02 – Boundary Surveying
      name: 'Boundary Surveying',
      slug: 'boundary-surveying',
      shortDescription: 'Defining legal property limits with high precision.',
      detailedDescription:
        'Defining legal property limits with surgical accuracy to mitigate risk and ensure compliance.',
      order: 2,
      title: 'Boundary Surveying',
      description:
        'Defining legal property limits with surgical accuracy to mitigate risk and ensure compliance.',
      process:
        'Defining legal property limits with surgical accuracy to mitigate risk and ensure compliance.',
      mainTasks: [
        {
          title: 'Legal Compliance',
          description: 'Ensure property boundaries meet regulations.',
        },
        {
          title: 'Dispute Resolution',
          description: 'Clear documentation for property conflicts.',
        },
        {
          title: 'Precision Mapping',
          description: 'Accurate boundary delineation services.',
        },
      ],
    },
    {
      // Service 03 – Topographic Surveying
      name: 'Topographic Surveying',
      slug: 'topographic-surveying',
      shortDescription:
        'High-resolution 3D terrain modeling and contour mapping.',
      detailedDescription:
        'High-resolution 3D terrain modeling and contour mapping for comprehensive site analysis.',
      order: 3,
      title: 'Topographic Surveying',
      description:
        'High-resolution 3D terrain modeling and contour mapping for comprehensive site analysis.',
      process:
        'High-resolution 3D terrain modeling and contour mapping for comprehensive site analysis.',
      mainTasks: [
        {
          title: 'Terrain Analysis',
          description: 'Detailed elevation and contour mapping.',
        },
        {
          title: '3D Visualization',
          description: 'Interactive terrain models for planning.',
        },
        {
          title: 'Site Assessment',
          description: 'Comprehensive land evaluation reports.',
        },
      ],
    },
    {
      // Service 04 – Construction Layout
      name: 'Construction Layout',
      slug: 'construction-layout',
      shortDescription:
        'Translating blueprints to reality with precise on-site staking.',
      detailedDescription:
        'Translating blueprints to reality with precision staking and gridline establishment on-site.',
      order: 4,
      title: 'Construction Layout',
      description:
        'Translating blueprints to reality with precision staking and gridline establishment on-site.',
      process:
        'Translating blueprints to reality with precision staking and gridline establishment on-site.',
      mainTasks: [
        {
          title: 'Site Preparation',
          description: 'Accurate staking for construction projects.',
        },
        {
          title: 'Quality Control',
          description: 'Ensure alignment with design specifications.',
        },
        {
          title: 'Safety Protocols',
          description: 'Maintain safety standards on-site.',
        },
      ],
    },
    {
      // Service 05 – Interior Design
      name: 'Interior Design',
      slug: 'interior-design',
      shortDescription: 'Bespoke spatial planning and aesthetic curation.',
      detailedDescription:
        'Bespoke spatial planning and aesthetic curation for high-end residential and commercial environments.',
      order: 5,
      title: 'Interior Design',
      description:
        'Bespoke spatial planning and aesthetic curation for high-end residential and commercial environments.',
      process:
        'Bespoke spatial planning and aesthetic curation for high-end residential and commercial environments.',
      mainTasks: [
        {
          title: 'Space Planning',
          description: 'Optimize layouts for functionality and aesthetics.',
        },
        {
          title: 'Custom Design',
          description: 'Tailored interiors for unique preferences.',
        },
        {
          title: 'Material Selection',
          description: 'Premium finishes and furnishings.',
        },
      ],
    },
    {
      // Service 06 – House Design
      name: 'House Design',
      slug: 'house-design',
      shortDescription: 'End-to-end architectural solutions for modern living.',
      detailedDescription:
        'End-to-end architectural solutions and project management from conceptualization to key handover.',
      order: 6,
      title: 'House Design',
      description:
        'End-to-end architectural solutions and project management from conceptualization to key handover.',
      process:
        'End-to-end architectural solutions and project management from conceptualization to key handover.',
      mainTasks: [
        {
          title: 'Architectural Plans',
          description: 'Complete design from concept to completion.',
        },
        {
          title: 'Modern Aesthetics',
          description: 'Contemporary designs for modern living.',
        },
        {
          title: 'Project Management',
          description: 'End-to-end construction oversight.',
        },
      ],
    },
    {
      // Service 07 – Construction Supervision
      name: 'Construction Supervision',
      slug: 'construction-supervision',
      shortDescription:
        'Expert supervision for structural integrity and safety.',
      detailedDescription:
        'Expert technical oversight ensuring structural integrity and adherence to international safety standards.',
      order: 7,
      title: 'Construction Supervision',
      description:
        'Expert technical oversight ensuring structural integrity and adherence to international safety standards.',
      process:
        'Expert technical oversight ensuring structural integrity and adherence to international safety standards.',
      mainTasks: [
        {
          title: 'Quality Assurance',
          description: 'Monitor construction for compliance.',
        },
        {
          title: 'Safety Management',
          description: 'Enforce safety protocols on-site.',
        },
        {
          title: 'Progress Tracking',
          description: 'Regular updates and milestone reviews.',
        },
      ],
    },
    {
      // Service 08 – Property Valuation
      name: 'Property Valuation',
      slug: 'property-valuation',
      shortDescription: 'Professional valuation for real estate assets.',
      detailedDescription:
        'Professional market appraisal and financial assessment for real estate assets and infrastructure.',
      order: 8,
      title: 'Property Valuation',
      description:
        'Professional market appraisal and financial assessment for real estate assets and infrastructure.',
      process:
        'Professional market appraisal and financial assessment for real estate assets and infrastructure.',
      mainTasks: [
        {
          title: 'Market Analysis',
          description: 'Comprehensive property value assessment.',
        },
        {
          title: 'Investment Advice',
          description: 'Expert guidance for real estate decisions.',
        },
        {
          title: 'Financial Reports',
          description: 'Detailed valuation documentation.',
        },
      ],
    },
  ];

  const existingServices = await prisma.service.findMany();
  if (existingServices.length === 0) {
    await prisma.service.createMany({
      data: servicesData,
    });
    console.log('Created', servicesData.length, 'Service entities');
  } else {
    console.log('Services already exist:', existingServices.length);
  }

  // 3. Seed Projects with varying ProjectType and ProjectCategory
  const projectsData = [
    {
      title: 'Luxury Residential Villa',
      slug: 'luxury-residential-villa',
      description:
        'A modern luxury villa with sustainable design features and premium finishes.',
      location: 'Lagos, Nigeria',
      type: ProjectType.COMPLETED,
      category: ProjectCategory.RESIDENTIAL,
      featured: true,
      purchasable: true,
      isPublished: true,
      publishedAt: new Date(),
      documentTypes: [],
    },
    {
      title: 'Office Complex Phase 1',
      slug: 'office-complex-phase-1',
      description:
        'Multi-story commercial office building with modern amenities.',
      location: 'Abuja, Nigeria',
      type: ProjectType.COMPLETED,
      category: ProjectCategory.COMMERCIAL,
      featured: true,
      purchasable: false,
      isPublished: true,
      publishedAt: new Date(),
      documentTypes: [],
    },
    {
      title: 'Industrial Warehouse',
      slug: 'industrial-warehouse',
      description:
        'Large-scale industrial warehouse with loading docks and storage solutions.',
      location: 'Port Harcourt, Nigeria',
      type: ProjectType.COMPLETED,
      category: ProjectCategory.INDUSTRIAL,
      featured: false,
      purchasable: false,
      isPublished: true,
      publishedAt: new Date(),
      documentTypes: [],
    },
    {
      title: 'Affordable Housing Development',
      slug: 'affordable-housing-development',
      description: 'Planned affordable housing project with 50 units.',
      location: 'Ibadan, Nigeria',
      type: ProjectType.PLAN_TO_BUY,
      category: ProjectCategory.RESIDENTIAL,
      featured: false,
      purchasable: true,
      isPublished: true,
      publishedAt: new Date(),
      documentTypes: [],
    },
    {
      title: 'Shopping Mall Redevelopment',
      slug: 'shopping-mall-redevelopment',
      description:
        'Redevelopment plan for existing shopping mall with new retail spaces.',
      location: 'Lagos, Nigeria',
      type: ProjectType.PLAN_TO_BUY,
      category: ProjectCategory.COMMERCIAL,
      featured: true,
      purchasable: false,
      isPublished: true,
      publishedAt: new Date(),
      documentTypes: [],
    },
    {
      title: 'Manufacturing Plant',
      slug: 'manufacturing-plant',
      description:
        'New manufacturing facility with production and administrative areas.',
      location: 'Ogun State, Nigeria',
      type: ProjectType.PLAN_TO_BUY,
      category: ProjectCategory.INDUSTRIAL,
      featured: false,
      purchasable: false,
      isPublished: false,
      publishedAt: null,
      documentTypes: [],
    },
  ];

  const allServices = await prisma.service.findMany({
    orderBy: { order: 'asc' },
  });
  for (const [index, project] of projectsData.entries()) {
    const service = allServices[index % allServices.length];
    await prisma.project.upsert({
      where: { slug: project.slug },
      create: {
        ...project,
        services: {
          connect: [{ id: service.id }],
        },
      },
      update: {
        ...project,
        services: {
          set: [{ id: service.id }],
        },
      },
    });
  }
  console.log('Created/updated', projectsData.length, 'Project entities');

  // 4. Seed Jobs
  const jobsData = [
    {
      slug: 'senior-structural-engineer',
      title: 'Senior Structural Engineer',
      location: 'Lagos, Nigeria',
      employmentType: 'Full-time',
      department: 'Engineering',
      description:
        'We are looking for an experienced Senior Structural Engineer to lead our structural design team.',
      requirements:
        'BEng/MEng in Civil/Structural Engineering, 7+ years experience, PE license preferred.',
      responsibilities:
        'Lead structural design projects, mentor junior engineers, ensure code compliance.',
      isPublished: true,
    },
    {
      slug: 'project-manager',
      title: 'Project Manager',
      location: 'Abuja, Nigeria',
      employmentType: 'Full-time',
      department: 'Operations',
      description:
        'Join our team as a Project Manager to oversee construction projects.',
      requirements:
        'BSc in Civil Engineering or Construction Management, 5+ years PM experience, PMP certification preferred.',
      responsibilities:
        'Manage project timelines, budgets, and stakeholders. Coordinate with design and construction teams.',
      isPublished: true,
    },
    {
      slug: 'junior-architect',
      title: 'Junior Architect',
      location: 'Lagos, Nigeria',
      employmentType: 'Full-time',
      department: 'Design',
      description:
        'Entry-level position for a motivated architect to grow with our design team.',
      requirements:
        'BArch degree, 1-2 years experience, proficiency in AutoCAD and Revit.',
      responsibilities:
        'Assist with design development, prepare drawings, support senior architects.',
      isPublished: true,
    },
    {
      slug: 'quantity-surveyor',
      title: 'Quantity Surveyor',
      location: 'Remote',
      employmentType: 'Contract',
      department: 'Cost Management',
      description:
        'Experienced Quantity Surveyor for cost estimation and tender preparation.',
      requirements:
        'BSc in Quantity Surveying or related field, 4+ years experience, RICS membership preferred.',
      responsibilities:
        'Prepare bills of quantities, cost estimates, and tender documentation.',
      isPublished: false,
    },
  ];

  for (const job of jobsData) {
    await prisma.job.upsert({
      where: { slug: job.slug },
      create: job,
      update: job,
    });
  }
  console.log('Created/updated', jobsData.length, 'Job entities');

  console.log('Seeding completed successfully.');
  console.log('\nAdmin credentials (if newly created):');
  console.log('  EMAIL:', adminEmail);
  console.log('  PASSWORD:', adminPassword);
  console.log('  Please change the password after first login.');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
