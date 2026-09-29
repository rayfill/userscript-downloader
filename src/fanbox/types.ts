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

export const fileMapType = z.record(z.string(), fileType.extend({
  size: z.number().pipe(z.int().positive())
}));

export const imageMapType = z.record(z.string(), imageType);

const coverType = z.object({
  type: z.string(),
  url: z.string(),
});

export const embedPostUserType = z.object({
  iconUrl: z.string().pipe(z.url()),
  name: z.string(),
  userId: z.string(),
});

export const embedPostInfoType = z.object({
  cover: coverType,
  creatorId: z.string(),
  id: z.string(),
  title: z.string(),
  publishedDatetime: z.string().pipe(z.coerce.date()),
  updatedDatetime: z.string().pipe(z.coerce.date()),
  user: embedPostUserType,
});

export const urlEmbedMapType = z.record(z.string(), z.object({
  id: z.string(),
  postInfo: embedPostInfoType.optional(),
  type: z.string().optional(),
  html: z.string().optional(),
  url: z.string().pipe(z.url()).optional(),
  host: z.string().optional(),
}));

export const postArticleBodyType = z.object({
  blocks: z.array(z.union([blockType])),
  embedMap: embedMapType,
  fileMap: fileMapType,
  imageMap: imageMapType,
  urlEmbedMap: urlEmbedMapType,
});

export const postImageBodyType = z.object({
  images: z.array(imageType),
  text: z.string(),
});

export const postFileBodyType = z.object({
  files: z.array(fileType),
  text: z.string(),
});

const userType = z.object({
  iconUrl: z.string().pipe(z.url()),
  name: z.string(),
  userId: z.string(),
});

const postInfoDetailType = z.object({
  coverImageUrl: z.string().pipe(z.url()).nullable(),
  creatorId: z.string(),
  id: z.string(),
  publishedDatetime: z.string().pipe(z.coerce.date()),
  updatedDatetime: z.string().pipe(z.coerce.date()),
  title: z.string(),
  user: userType,
});

export const postArticleType = postInfoDetailType.extend({
  type: z.literal(['article']),
  body: postArticleBodyType,
});

export const postImageType = postInfoDetailType.extend({
  type: z.literal(['image']),
  body: postImageBodyType,
});

export const postFileType = postInfoDetailType.extend({
  type: z.literal(['file']),
  body: postFileBodyType,
});

const postType = z.union([postArticleType, postImageType, postFileType]);

const postInfoBodyType = z.object({
  post: postType
});

export const postInfoType = z.object({
  body: postInfoBodyType,
});
