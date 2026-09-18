import { z } from 'zod';

const fileType = z.object({
  extension: z.string(), // example: "zip"
  id: z.string(), // example: "JzSDD3auGh68ThsBxIsL5y6I"
  name: z.string(),
  url: z.string().pipe(z.url()),
});

const imageType = z.object({
  extension: z.string(), // example: "png'
  height: z.number().pipe(z.int().positive()),
  width: z.number().pipe(z.int().positive()),
  id: z.string(), // example: "X5M3LH69ywBKAli3DK3QtwoG"
  originalUrl: z.string().pipe(z.url()),
  thumbnailUrl: z.string().pipe(z.url()),
});

const blockStyleType = z.object({
  type: z.string(),
  offset: z.number().pipe(z.int().nonnegative()),
  length: z.number().pipe(z.int().positive()),
});

const headerBlockType = z.object({
  type: z.literal(['header']),
  text: z.string(),
});

const pBlockType = z.object({
  type: z.literal(['p']),
  text: z.string(),
  styles: z.array(blockStyleType).optional(),
});

const embedRefBlockType = z.object({
  type: z.literal(['embed']),
  embedId: z.string(),
});

const fileRefBlockType = z.object({
  type: z.literal(['file']),
  fileId: z.string(),
});

const imageRefBlockType = z.object({
  type: z.literal(['image']),
  imageId: z.string(),
});

const urlEmbedRefBlockType = z.object({
  type: z.literal(['url_embed']),
  urlEmbedId: z.string(),
});

const blockType = z.union([
  pBlockType,
  headerBlockType,
  embedRefBlockType,
  fileRefBlockType,
  imageRefBlockType,
  urlEmbedRefBlockType
]);

const embedMapType = z.record(z.string(), z.object({}));

const fileMapType = z.record(z.string(), fileType.extend({
  size: z.number().pipe(z.int().positive())
}));

const imageMapType = z.record(z.string(), imageType);

const coverType = z.object({
  type: z.string(),
  url: z.string(),
});

const embedPostUserType = z.object({
  iconUrl: z.string().pipe(z.url()),
  name: z.string(),
  userId: z.string(),
});

const embedPostInfoType = z.object({
  cover: coverType,
  creatorId: z.string(),
  id: z.string(),
  title: z.string(),
  publishedDatetime: z.string().pipe(z.coerce.date()),
  updatedDatetime: z.string().pipe(z.coerce.date()),
  user: embedPostUserType,
});

const urlEmbedMapType = z.record(z.string(), z.object({
  id: z.string(),
  postInfo: embedPostInfoType,
  type: z.string().optional(),
  html: z.string().optional(),
}));

const postBodyBlockType = z.object({
  blocks: z.array(z.union([blockType])),
  embedMap: embedMapType,
  fileMap: fileMapType,
  imageMap: imageMapType,
  urlEmbedMap: urlEmbedMapType,
});

const postBodyType = z.object({
  files: z.array(fileType).optional(),
  images: z.array(imageType).optional(),
  text: z.string(),
});

const userType = z.object({
  iconUrl: z.string().pipe(z.url()),
  name: z.string(),
  userId: z.string(),
});

const postType = z.object({
  body: z.union([postBodyType, postBodyBlockType]),
  coverImageUrl: z.string().pipe(z.url()),
  creatorId: z.string(),
  id: z.string(),
  publishedDatetime: z.string().pipe(z.coerce.date()),
  updatedDatetime: z.string().pipe(z.coerce.date()),
  title: z.string(),
  type: z.string(),
  user: userType,
});

const postInfoBodyType = z.object({
  post: postType
});

export const postInfoType = z.object({
  body: postInfoBodyType,
});
