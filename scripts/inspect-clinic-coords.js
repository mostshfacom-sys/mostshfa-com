const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const columns = await prisma.$queryRaw`
    select column_name, data_type
    from information_schema.columns
    where table_name = 'clinics'
    order by ordinal_position
  `;

  const metaCount = await prisma.$queryRaw`
    select
      count(*)::int as total,
      count(*) filter (where metadata is not null and metadata::text ~ '(lat|lng|latitude|longitude)')::int as meta_has_coords
    from clinics
  `;

  const metaSample = await prisma.$queryRaw`
    select id, name_ar, left(metadata::text, 200) as meta_preview
    from clinics
    where metadata is not null and metadata::text ~ '(lat|lng|latitude|longitude)'
    limit 10
  `;

  console.log(JSON.stringify({ columns, metaCount, metaSample }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
