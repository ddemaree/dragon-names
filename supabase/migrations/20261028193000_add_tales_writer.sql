-- The anonymous browser that started the story; only it can add parts
alter table public.tales add column writer uuid;
