import { getAdvancedSchemas } from "@/lib/seo/schemas";

export default function JsonLd() {
  const schemas = getAdvancedSchemas();

  return (
    <>
      {schemas.map((schema: any, index) => (
        <script
          key={schema['@type'] ? `${schema['@type']}-${index}` : index}
          type="application/ld+json"
        >
          {JSON.stringify(schema)}
        </script>
      ))}
    </>
  );
}
