import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('sifre1234', 10);

  const host = await prisma.user.create({
    data: {
      email: 'ev-sahibi@ornek.com',
      passwordHash,
      firstName: 'Ayşe',
      lastName: 'Yılmaz',
      isHost: true,
      role: 'HOST',
    },
  });

  await prisma.listing.create({
    data: {
      hostId: host.id,
      title: 'Boğaz Manzaralı Şirin Daire',
      description: 'Beşiktaş\'ta, yürüyüş mesafesinde vapur iskelesi olan aydınlık bir daire.',
      address: 'Beşiktaş, İstanbul',
      city: 'İstanbul',
      country: 'Türkiye',
      latitude: 41.0422,
      longitude: 29.0083,
      pricePerNight: 1850,
      maxGuests: 4,
      bedrooms: 2,
      bathrooms: 1,
      amenities: ['Wifi', 'Mutfak', 'Çamaşır makinesi', 'Klima'],
      photos: {
        create: [{ url: 'https://picsum.photos/seed/istanbul1/800/600', order: 0 }],
      },
    },
  });

  console.log('Seed verisi başarıyla oluşturuldu.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
