import Pos from "./Pos";

const MAX_ANGLE_DEGREE = 1024;

const ANGLE_000 = 0;
const ANGLE_090 = 256;
const ANGLE_180 = 512;
const ANGLE_270 = 768;
const ANGLE_360 = 1024;

const A360TO1024 = a => a * 1024 / 360;
const A1024TO360 = a => a * 360 / 1024;

const ArcTanTbl = [
    0xffffff80, 0xffffff80, 0xffffff80, 0xffffff80, 0xffffff80, 0xffffff80, 0xffffff80, 0xffffff80, 0xffffff80, 0xffffff80,
    0xffffff80, 0xffffff81, 0xffffff81, 0xffffff81, 0xffffff81, 0xffffff81, 0xffffff81, 0xffffff81, 0xffffff81, 0xffffff81,
    0xffffff81, 0xffffff81, 0xffffff81, 0xffffff82, 0xffffff82, 0xffffff82, 0xffffff82, 0xffffff82, 0xffffff82, 0xffffff82,
    0xffffff82, 0xffffff82, 0xffffff82, 0xffffff82, 0xffffff82, 0xffffff83, 0xffffff83, 0xffffff83, 0xffffff83, 0xffffff83,
    0xffffff83, 0xffffff83, 0xffffff83, 0xffffff83, 0xffffff83, 0xffffff83, 0xffffff83, 0xffffff84, 0xffffff84, 0xffffff84,
    0xffffff84, 0xffffff84, 0xffffff84, 0xffffff84, 0xffffff84, 0xffffff84, 0xffffff84, 0xffffff84, 0xffffff84, 0xffffff85,
    0xffffff85, 0xffffff85, 0xffffff85, 0xffffff85, 0xffffff85, 0xffffff85, 0xffffff85, 0xffffff85, 0xffffff85, 0xffffff85,
    0xffffff85, 0xffffff86, 0xffffff86, 0xffffff86, 0xffffff86, 0xffffff86, 0xffffff86, 0xffffff86, 0xffffff86, 0xffffff86,
    0xffffff86, 0xffffff86, 0xffffff87, 0xffffff87, 0xffffff87, 0xffffff87, 0xffffff87, 0xffffff87, 0xffffff87, 0xffffff87,
    0xffffff87, 0xffffff87, 0xffffff87, 0xffffff87, 0xffffff88, 0xffffff88, 0xffffff88, 0xffffff88, 0xffffff88, 0xffffff88,
    0xffffff88, 0xffffff88, 0xffffff88, 0xffffff88, 0xffffff88, 0xffffff89, 0xffffff89, 0xffffff89, 0xffffff89, 0xffffff89,
    0xffffff89, 0xffffff89, 0xffffff89, 0xffffff89, 0xffffff89, 0xffffff89, 0xffffff8a, 0xffffff8a, 0xffffff8a, 0xffffff8a,
    0xffffff8a, 0xffffff8a, 0xffffff8a, 0xffffff8a, 0xffffff8a, 0xffffff8a, 0xffffff8a, 0xffffff8b, 0xffffff8b, 0xffffff8b,
    0xffffff8b, 0xffffff8b, 0xffffff8b, 0xffffff8b, 0xffffff8b, 0xffffff8b, 0xffffff8b, 0xffffff8b, 0xffffff8c, 0xffffff8c,
    0xffffff8c, 0xffffff8c, 0xffffff8c, 0xffffff8c, 0xffffff8c, 0xffffff8c, 0xffffff8c, 0xffffff8c, 0xffffff8c, 0xffffff8d,
    0xffffff8d, 0xffffff8d, 0xffffff8d, 0xffffff8d, 0xffffff8d, 0xffffff8d, 0xffffff8d, 0xffffff8d, 0xffffff8d, 0xffffff8d,
    0xffffff8e, 0xffffff8e, 0xffffff8e, 0xffffff8e, 0xffffff8e, 0xffffff8e, 0xffffff8e, 0xffffff8e, 0xffffff8e, 0xffffff8e,
    0xffffff8e, 0xffffff8f, 0xffffff8f, 0xffffff8f, 0xffffff8f, 0xffffff8f, 0xffffff8f, 0xffffff8f, 0xffffff8f, 0xffffff8f,
    0xffffff8f, 0xffffff90, 0xffffff90, 0xffffff90, 0xffffff90, 0xffffff90, 0xffffff90, 0xffffff90, 0xffffff90, 0xffffff90,
    0xffffff90, 0xffffff91, 0xffffff91, 0xffffff91, 0xffffff91, 0xffffff91, 0xffffff91, 0xffffff91, 0xffffff91, 0xffffff91,
    0xffffff91, 0xffffff91, 0xffffff92, 0xffffff92, 0xffffff92, 0xffffff92, 0xffffff92, 0xffffff92, 0xffffff92, 0xffffff92,
    0xffffff92, 0xffffff92, 0xffffff93, 0xffffff93, 0xffffff93, 0xffffff93, 0xffffff93, 0xffffff93, 0xffffff93, 0xffffff93,
    0xffffff93, 0xffffff93, 0xffffff94, 0xffffff94, 0xffffff94, 0xffffff94, 0xffffff94, 0xffffff94, 0xffffff94, 0xffffff94,
    0xffffff94, 0xffffff94, 0xffffff95, 0xffffff95, 0xffffff95, 0xffffff95, 0xffffff95, 0xffffff95, 0xffffff95, 0xffffff95,
    0xffffff95, 0xffffff95, 0xffffff96, 0xffffff96, 0xffffff96, 0xffffff96, 0xffffff96, 0xffffff96, 0xffffff96, 0xffffff96,
    0xffffff96, 0xffffff96, 0xffffff97, 0xffffff97, 0xffffff97, 0xffffff97, 0xffffff97, 0xffffff97, 0xffffff97, 0xffffff97,
    0xffffff97, 0xffffff97, 0xffffff98, 0xffffff98, 0xffffff98, 0xffffff98, 0xffffff98, 0xffffff98, 0xffffff98, 0xffffff98,
    0xffffff98, 0xffffff99, 0xffffff99, 0xffffff99, 0xffffff99, 0xffffff99, 0xffffff99, 0xffffff99, 0xffffff99, 0xffffff99,
    0xffffff99, 0xffffff9a, 0xffffff9a, 0xffffff9a, 0xffffff9a, 0xffffff9a, 0xffffff9a, 0xffffff9a, 0xffffff9a, 0xffffff9a,
    0xffffff9b, 0xffffff9b, 0xffffff9b, 0xffffff9b, 0xffffff9b, 0xffffff9b, 0xffffff9b, 0xffffff9b, 0xffffff9b, 0xffffff9b,
    0xffffff9c, 0xffffff9c, 0xffffff9c, 0xffffff9c, 0xffffff9c, 0xffffff9c, 0xffffff9c, 0xffffff9c, 0xffffff9c, 0xffffff9d,
    0xffffff9d, 0xffffff9d, 0xffffff9d, 0xffffff9d, 0xffffff9d, 0xffffff9d, 0xffffff9d, 0xffffff9d, 0xffffff9e, 0xffffff9e,
    0xffffff9e, 0xffffff9e, 0xffffff9e, 0xffffff9e, 0xffffff9e, 0xffffff9e, 0xffffff9e, 0xffffff9e, 0xffffff9f, 0xffffff9f,
    0xffffff9f, 0xffffff9f, 0xffffff9f, 0xffffff9f, 0xffffff9f, 0xffffff9f, 0xffffff9f, 0xffffffa0, 0xffffffa0, 0xffffffa0,
    0xffffffa0, 0xffffffa0, 0xffffffa0, 0xffffffa0, 0xffffffa0, 0xffffffa0, 0xffffffa1, 0xffffffa1, 0xffffffa1, 0xffffffa1,
    0xffffffa1, 0xffffffa1, 0xffffffa1, 0xffffffa1, 0xffffffa1, 0xffffffa2, 0xffffffa2, 0xffffffa2, 0xffffffa2, 0xffffffa2,
    0xffffffa2, 0xffffffa2, 0xffffffa2, 0xffffffa2, 0xffffffa3, 0xffffffa3, 0xffffffa3, 0xffffffa3, 0xffffffa3, 0xffffffa3,
    0xffffffa3, 0xffffffa3, 0xffffffa4, 0xffffffa4, 0xffffffa4, 0xffffffa4, 0xffffffa4, 0xffffffa4, 0xffffffa4, 0xffffffa4,
    0xffffffa4, 0xffffffa5, 0xffffffa5, 0xffffffa5, 0xffffffa5, 0xffffffa5, 0xffffffa5, 0xffffffa5, 0xffffffa5, 0xffffffa5,
    0xffffffa6, 0xffffffa6, 0xffffffa6, 0xffffffa6, 0xffffffa6, 0xffffffa6, 0xffffffa6, 0xffffffa6, 0xffffffa7, 0xffffffa7,
    0xffffffa7, 0xffffffa7, 0xffffffa7, 0xffffffa7, 0xffffffa7, 0xffffffa7, 0xffffffa7, 0xffffffa8, 0xffffffa8, 0xffffffa8,
    0xffffffa8, 0xffffffa8, 0xffffffa8, 0xffffffa8, 0xffffffa8, 0xffffffa9, 0xffffffa9, 0xffffffa9, 0xffffffa9, 0xffffffa9,
    0xffffffa9, 0xffffffa9, 0xffffffa9, 0xffffffa9, 0xffffffaa, 0xffffffaa, 0xffffffaa, 0xffffffaa, 0xffffffaa, 0xffffffaa,
    0xffffffaa, 0xffffffaa, 0xffffffab, 0xffffffab, 0xffffffab, 0xffffffab, 0xffffffab, 0xffffffab, 0xffffffab, 0xffffffab,
    0xffffffab, 0xffffffac, 0xffffffac, 0xffffffac, 0xffffffac, 0xffffffac, 0xffffffac, 0xffffffac, 0xffffffac, 0xffffffad,
    0xffffffad, 0xffffffad, 0xffffffad, 0xffffffad, 0xffffffad, 0xffffffad, 0xffffffad, 0xffffffae, 0xffffffae, 0xffffffae,
    0xffffffae, 0xffffffae, 0xffffffae, 0xffffffae, 0xffffffae, 0xffffffaf, 0xffffffaf, 0xffffffaf, 0xffffffaf, 0xffffffaf,
    0xffffffaf, 0xffffffaf, 0xffffffaf, 0xffffffb0, 0xffffffb0, 0xffffffb0, 0xffffffb0, 0xffffffb0, 0xffffffb0, 0xffffffb0,
    0xffffffb0, 0xffffffb1, 0xffffffb1, 0xffffffb1, 0xffffffb1, 0xffffffb1, 0xffffffb1, 0xffffffb1, 0xffffffb1, 0xffffffb2,
    0xffffffb2, 0xffffffb2, 0xffffffb2, 0xffffffb2, 0xffffffb2, 0xffffffb2, 0xffffffb2, 0xffffffb3, 0xffffffb3, 0xffffffb3,
    0xffffffb3, 0xffffffb3, 0xffffffb3, 0xffffffb3, 0xffffffb3, 0xffffffb4, 0xffffffb4, 0xffffffb4, 0xffffffb4, 0xffffffb4,
    0xffffffb4, 0xffffffb4, 0xffffffb4, 0xffffffb5, 0xffffffb5, 0xffffffb5, 0xffffffb5, 0xffffffb5, 0xffffffb5, 0xffffffb5,
    0xffffffb5, 0xffffffb6, 0xffffffb6, 0xffffffb6, 0xffffffb6, 0xffffffb6, 0xffffffb6, 0xffffffb6, 0xffffffb7, 0xffffffb7,
    0xffffffb7, 0xffffffb7, 0xffffffb7, 0xffffffb7, 0xffffffb7, 0xffffffb7, 0xffffffb8, 0xffffffb8, 0xffffffb8, 0xffffffb8,
    0xffffffb8, 0xffffffb8, 0xffffffb8, 0xffffffb8, 0xffffffb9, 0xffffffb9, 0xffffffb9, 0xffffffb9, 0xffffffb9, 0xffffffb9,
    0xffffffb9, 0xffffffba, 0xffffffba, 0xffffffba, 0xffffffba, 0xffffffba, 0xffffffba, 0xffffffba, 0xffffffba, 0xffffffbb,
    0xffffffbb, 0xffffffbb, 0xffffffbb, 0xffffffbb, 0xffffffbb, 0xffffffbb, 0xffffffbc, 0xffffffbc, 0xffffffbc, 0xffffffbc,
    0xffffffbc, 0xffffffbc, 0xffffffbc, 0xffffffbc, 0xffffffbd, 0xffffffbd, 0xffffffbd, 0xffffffbd, 0xffffffbd, 0xffffffbd,
    0xffffffbd, 0xffffffbe, 0xffffffbe, 0xffffffbe, 0xffffffbe, 0xffffffbe, 0xffffffbe, 0xffffffbe, 0xffffffbe, 0xffffffbf,
    0xffffffbf, 0xffffffbf, 0xffffffbf, 0xffffffbf, 0xffffffbf, 0xffffffbf, 0xffffffc0, 0xffffffc0, 0xffffffc0, 0xffffffc0,
    0xffffffc0, 0xffffffc0, 0xffffffc0, 0xffffffc1, 0xffffffc1, 0xffffffc1, 0xffffffc1, 0xffffffc1, 0xffffffc1, 0xffffffc1,
    0xffffffc1, 0xffffffc2, 0xffffffc2, 0xffffffc2, 0xffffffc2, 0xffffffc2, 0xffffffc2, 0xffffffc2, 0xffffffc3, 0xffffffc3,
    0xffffffc3, 0xffffffc3, 0xffffffc3, 0xffffffc3, 0xffffffc3, 0xffffffc4, 0xffffffc4, 0xffffffc4, 0xffffffc4, 0xffffffc4,
    0xffffffc4, 0xffffffc4, 0xffffffc5, 0xffffffc5, 0xffffffc5, 0xffffffc5, 0xffffffc5, 0xffffffc5, 0xffffffc5, 0xffffffc6,
    0xffffffc6, 0xffffffc6, 0xffffffc6, 0xffffffc6, 0xffffffc6, 0xffffffc6, 0xffffffc7, 0xffffffc7, 0xffffffc7, 0xffffffc7,
    0xffffffc7, 0xffffffc7, 0xffffffc7, 0xffffffc7, 0xffffffc8, 0xffffffc8, 0xffffffc8, 0xffffffc8, 0xffffffc8, 0xffffffc8,
    0xffffffc8, 0xffffffc9, 0xffffffc9, 0xffffffc9, 0xffffffc9, 0xffffffc9, 0xffffffc9, 0xffffffc9, 0xffffffca, 0xffffffca,
    0xffffffca, 0xffffffca, 0xffffffca, 0xffffffca, 0xffffffca, 0xffffffcb, 0xffffffcb, 0xffffffcb, 0xffffffcb, 0xffffffcb,
    0xffffffcb, 0xffffffcb, 0xffffffcc, 0xffffffcc, 0xffffffcc, 0xffffffcc, 0xffffffcc, 0xffffffcc, 0xffffffcd, 0xffffffcd,
    0xffffffcd, 0xffffffcd, 0xffffffcd, 0xffffffcd, 0xffffffcd, 0xffffffce, 0xffffffce, 0xffffffce, 0xffffffce, 0xffffffce,
    0xffffffce, 0xffffffce, 0xffffffcf, 0xffffffcf, 0xffffffcf, 0xffffffcf, 0xffffffcf, 0xffffffcf, 0xffffffcf, 0xffffffd0,
    0xffffffd0, 0xffffffd0, 0xffffffd0, 0xffffffd0, 0xffffffd0, 0xffffffd0, 0xffffffd1, 0xffffffd1, 0xffffffd1, 0xffffffd1,
    0xffffffd1, 0xffffffd1, 0xffffffd1, 0xffffffd2, 0xffffffd2, 0xffffffd2, 0xffffffd2, 0xffffffd2, 0xffffffd2, 0xffffffd2,
    0xffffffd3, 0xffffffd3, 0xffffffd3, 0xffffffd3, 0xffffffd3, 0xffffffd3, 0xffffffd4, 0xffffffd4, 0xffffffd4, 0xffffffd4,
    0xffffffd4, 0xffffffd4, 0xffffffd4, 0xffffffd5, 0xffffffd5, 0xffffffd5, 0xffffffd5, 0xffffffd5, 0xffffffd5, 0xffffffd5,
    0xffffffd6, 0xffffffd6, 0xffffffd6, 0xffffffd6, 0xffffffd6, 0xffffffd6, 0xffffffd7, 0xffffffd7, 0xffffffd7, 0xffffffd7,
    0xffffffd7, 0xffffffd7, 0xffffffd7, 0xffffffd8, 0xffffffd8, 0xffffffd8, 0xffffffd8, 0xffffffd8, 0xffffffd8, 0xffffffd8,
    0xffffffd9, 0xffffffd9, 0xffffffd9, 0xffffffd9, 0xffffffd9, 0xffffffd9, 0xffffffda, 0xffffffda, 0xffffffda, 0xffffffda,
    0xffffffda, 0xffffffda, 0xffffffda, 0xffffffdb, 0xffffffdb, 0xffffffdb, 0xffffffdb, 0xffffffdb, 0xffffffdb, 0xffffffdc,
    0xffffffdc, 0xffffffdc, 0xffffffdc, 0xffffffdc, 0xffffffdc, 0xffffffdc, 0xffffffdd, 0xffffffdd, 0xffffffdd, 0xffffffdd,
    0xffffffdd, 0xffffffdd, 0xffffffdd, 0xffffffde, 0xffffffde, 0xffffffde, 0xffffffde, 0xffffffde, 0xffffffde, 0xffffffdf,
    0xffffffdf, 0xffffffdf, 0xffffffdf, 0xffffffdf, 0xffffffdf, 0xffffffdf, 0xffffffe0, 0xffffffe0, 0xffffffe0, 0xffffffe0,
    0xffffffe0, 0xffffffe0, 0xffffffe1, 0xffffffe1, 0xffffffe1, 0xffffffe1, 0xffffffe1, 0xffffffe1, 0xffffffe1, 0xffffffe2,
    0xffffffe2, 0xffffffe2, 0xffffffe2, 0xffffffe2, 0xffffffe2, 0xffffffe3, 0xffffffe3, 0xffffffe3, 0xffffffe3, 0xffffffe3,
    0xffffffe3, 0xffffffe3, 0xffffffe4, 0xffffffe4, 0xffffffe4, 0xffffffe4, 0xffffffe4, 0xffffffe4, 0xffffffe5, 0xffffffe5,
    0xffffffe5, 0xffffffe5, 0xffffffe5, 0xffffffe5, 0xffffffe6, 0xffffffe6, 0xffffffe6, 0xffffffe6, 0xffffffe6, 0xffffffe6,
    0xffffffe6, 0xffffffe7, 0xffffffe7, 0xffffffe7, 0xffffffe7, 0xffffffe7, 0xffffffe7, 0xffffffe8, 0xffffffe8, 0xffffffe8,
    0xffffffe8, 0xffffffe8, 0xffffffe8, 0xffffffe8, 0xffffffe9, 0xffffffe9, 0xffffffe9, 0xffffffe9, 0xffffffe9, 0xffffffe9,
    0xffffffea, 0xffffffea, 0xffffffea, 0xffffffea, 0xffffffea, 0xffffffea, 0xffffffeb, 0xffffffeb, 0xffffffeb, 0xffffffeb,
    0xffffffeb, 0xffffffeb, 0xffffffeb, 0xffffffec, 0xffffffec, 0xffffffec, 0xffffffec, 0xffffffec, 0xffffffec, 0xffffffed,
    0xffffffed, 0xffffffed, 0xffffffed, 0xffffffed, 0xffffffed, 0xffffffee, 0xffffffee, 0xffffffee, 0xffffffee, 0xffffffee,
    0xffffffee, 0xffffffee, 0xffffffef, 0xffffffef, 0xffffffef, 0xffffffef, 0xffffffef, 0xffffffef, 0xfffffff0, 0xfffffff0,
    0xfffffff0, 0xfffffff0, 0xfffffff0, 0xfffffff0, 0xfffffff1, 0xfffffff1, 0xfffffff1, 0xfffffff1, 0xfffffff1, 0xfffffff1,
    0xfffffff1, 0xfffffff2, 0xfffffff2, 0xfffffff2, 0xfffffff2, 0xfffffff2, 0xfffffff2, 0xfffffff3, 0xfffffff3, 0xfffffff3,
    0xfffffff3, 0xfffffff3, 0xfffffff3, 0xfffffff4, 0xfffffff4, 0xfffffff4, 0xfffffff4, 0xfffffff4, 0xfffffff4, 0xfffffff5,
    0xfffffff5, 0xfffffff5, 0xfffffff5, 0xfffffff5, 0xfffffff5, 0xfffffff5, 0xfffffff6, 0xfffffff6, 0xfffffff6, 0xfffffff6,
    0xfffffff6, 0xfffffff6, 0xfffffff7, 0xfffffff7, 0xfffffff7, 0xfffffff7, 0xfffffff7, 0xfffffff7, 0xfffffff8, 0xfffffff8,
    0xfffffff8, 0xfffffff8, 0xfffffff8, 0xfffffff8, 0xfffffff8, 0xfffffff9, 0xfffffff9, 0xfffffff9, 0xfffffff9, 0xfffffff9,
    0xfffffff9, 0xfffffffa, 0xfffffffa, 0xfffffffa, 0xfffffffa, 0xfffffffa, 0xfffffffa, 0xfffffffb, 0xfffffffb, 0xfffffffb,
    0xfffffffb, 0xfffffffb, 0xfffffffb, 0xfffffffc, 0xfffffffc, 0xfffffffc, 0xfffffffc, 0xfffffffc, 0xfffffffc, 0xfffffffc,
    0xfffffffd, 0xfffffffd, 0xfffffffd, 0xfffffffd, 0xfffffffd, 0xfffffffd, 0xfffffffe, 0xfffffffe, 0xfffffffe, 0xfffffffe,
    0xfffffffe, 0xfffffffe, 0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff, 0x00000000, 0x00000000,
    0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000,
    0x00000000, 0x00000001, 0x00000001, 0x00000001, 0x00000001, 0x00000001, 0x00000001, 0x00000002, 0x00000002, 0x00000002,
    0x00000002, 0x00000002, 0x00000002, 0x00000003, 0x00000003, 0x00000003, 0x00000003, 0x00000003, 0x00000003, 0x00000004,
    0x00000004, 0x00000004, 0x00000004, 0x00000004, 0x00000004, 0x00000004, 0x00000005, 0x00000005, 0x00000005, 0x00000005,
    0x00000005, 0x00000005, 0x00000006, 0x00000006, 0x00000006, 0x00000006, 0x00000006, 0x00000006, 0x00000007, 0x00000007,
    0x00000007, 0x00000007, 0x00000007, 0x00000007, 0x00000008, 0x00000008, 0x00000008, 0x00000008, 0x00000008, 0x00000008,
    0x00000008, 0x00000009, 0x00000009, 0x00000009, 0x00000009, 0x00000009, 0x00000009, 0x0000000a, 0x0000000a, 0x0000000a,
    0x0000000a, 0x0000000a, 0x0000000a, 0x0000000b, 0x0000000b, 0x0000000b, 0x0000000b, 0x0000000b, 0x0000000b, 0x0000000b,
    0x0000000c, 0x0000000c, 0x0000000c, 0x0000000c, 0x0000000c, 0x0000000c, 0x0000000d, 0x0000000d, 0x0000000d, 0x0000000d,
    0x0000000d, 0x0000000d, 0x0000000e, 0x0000000e, 0x0000000e, 0x0000000e, 0x0000000e, 0x0000000e, 0x0000000f, 0x0000000f,
    0x0000000f, 0x0000000f, 0x0000000f, 0x0000000f, 0x0000000f, 0x00000010, 0x00000010, 0x00000010, 0x00000010, 0x00000010,
    0x00000010, 0x00000011, 0x00000011, 0x00000011, 0x00000011, 0x00000011, 0x00000011, 0x00000012, 0x00000012, 0x00000012,
    0x00000012, 0x00000012, 0x00000012, 0x00000012, 0x00000013, 0x00000013, 0x00000013, 0x00000013, 0x00000013, 0x00000013,
    0x00000014, 0x00000014, 0x00000014, 0x00000014, 0x00000014, 0x00000014, 0x00000015, 0x00000015, 0x00000015, 0x00000015,
    0x00000015, 0x00000015, 0x00000015, 0x00000016, 0x00000016, 0x00000016, 0x00000016, 0x00000016, 0x00000016, 0x00000017,
    0x00000017, 0x00000017, 0x00000017, 0x00000017, 0x00000017, 0x00000018, 0x00000018, 0x00000018, 0x00000018, 0x00000018,
    0x00000018, 0x00000018, 0x00000019, 0x00000019, 0x00000019, 0x00000019, 0x00000019, 0x00000019, 0x0000001a, 0x0000001a,
    0x0000001a, 0x0000001a, 0x0000001a, 0x0000001a, 0x0000001a, 0x0000001b, 0x0000001b, 0x0000001b, 0x0000001b, 0x0000001b,
    0x0000001b, 0x0000001c, 0x0000001c, 0x0000001c, 0x0000001c, 0x0000001c, 0x0000001c, 0x0000001d, 0x0000001d, 0x0000001d,
    0x0000001d, 0x0000001d, 0x0000001d, 0x0000001d, 0x0000001e, 0x0000001e, 0x0000001e, 0x0000001e, 0x0000001e, 0x0000001e,
    0x0000001f, 0x0000001f, 0x0000001f, 0x0000001f, 0x0000001f, 0x0000001f, 0x0000001f, 0x00000020, 0x00000020, 0x00000020,
    0x00000020, 0x00000020, 0x00000020, 0x00000021, 0x00000021, 0x00000021, 0x00000021, 0x00000021, 0x00000021, 0x00000021,
    0x00000022, 0x00000022, 0x00000022, 0x00000022, 0x00000022, 0x00000022, 0x00000023, 0x00000023, 0x00000023, 0x00000023,
    0x00000023, 0x00000023, 0x00000023, 0x00000024, 0x00000024, 0x00000024, 0x00000024, 0x00000024, 0x00000024, 0x00000024,
    0x00000025, 0x00000025, 0x00000025, 0x00000025, 0x00000025, 0x00000025, 0x00000026, 0x00000026, 0x00000026, 0x00000026,
    0x00000026, 0x00000026, 0x00000026, 0x00000027, 0x00000027, 0x00000027, 0x00000027, 0x00000027, 0x00000027, 0x00000028,
    0x00000028, 0x00000028, 0x00000028, 0x00000028, 0x00000028, 0x00000028, 0x00000029, 0x00000029, 0x00000029, 0x00000029,
    0x00000029, 0x00000029, 0x00000029, 0x0000002a, 0x0000002a, 0x0000002a, 0x0000002a, 0x0000002a, 0x0000002a, 0x0000002b,
    0x0000002b, 0x0000002b, 0x0000002b, 0x0000002b, 0x0000002b, 0x0000002b, 0x0000002c, 0x0000002c, 0x0000002c, 0x0000002c,
    0x0000002c, 0x0000002c, 0x0000002c, 0x0000002d, 0x0000002d, 0x0000002d, 0x0000002d, 0x0000002d, 0x0000002d, 0x0000002e,
    0x0000002e, 0x0000002e, 0x0000002e, 0x0000002e, 0x0000002e, 0x0000002e, 0x0000002f, 0x0000002f, 0x0000002f, 0x0000002f,
    0x0000002f, 0x0000002f, 0x0000002f, 0x00000030, 0x00000030, 0x00000030, 0x00000030, 0x00000030, 0x00000030, 0x00000030,
    0x00000031, 0x00000031, 0x00000031, 0x00000031, 0x00000031, 0x00000031, 0x00000031, 0x00000032, 0x00000032, 0x00000032,
    0x00000032, 0x00000032, 0x00000032, 0x00000032, 0x00000033, 0x00000033, 0x00000033, 0x00000033, 0x00000033, 0x00000033,
    0x00000033, 0x00000034, 0x00000034, 0x00000034, 0x00000034, 0x00000034, 0x00000034, 0x00000035, 0x00000035, 0x00000035,
    0x00000035, 0x00000035, 0x00000035, 0x00000035, 0x00000036, 0x00000036, 0x00000036, 0x00000036, 0x00000036, 0x00000036,
    0x00000036, 0x00000037, 0x00000037, 0x00000037, 0x00000037, 0x00000037, 0x00000037, 0x00000037, 0x00000038, 0x00000038,
    0x00000038, 0x00000038, 0x00000038, 0x00000038, 0x00000038, 0x00000039, 0x00000039, 0x00000039, 0x00000039, 0x00000039,
    0x00000039, 0x00000039, 0x00000039, 0x0000003a, 0x0000003a, 0x0000003a, 0x0000003a, 0x0000003a, 0x0000003a, 0x0000003a,
    0x0000003b, 0x0000003b, 0x0000003b, 0x0000003b, 0x0000003b, 0x0000003b, 0x0000003b, 0x0000003c, 0x0000003c, 0x0000003c,
    0x0000003c, 0x0000003c, 0x0000003c, 0x0000003c, 0x0000003d, 0x0000003d, 0x0000003d, 0x0000003d, 0x0000003d, 0x0000003d,
    0x0000003d, 0x0000003e, 0x0000003e, 0x0000003e, 0x0000003e, 0x0000003e, 0x0000003e, 0x0000003e, 0x0000003f, 0x0000003f,
    0x0000003f, 0x0000003f, 0x0000003f, 0x0000003f, 0x0000003f, 0x0000003f, 0x00000040, 0x00000040, 0x00000040, 0x00000040,
    0x00000040, 0x00000040, 0x00000040, 0x00000041, 0x00000041, 0x00000041, 0x00000041, 0x00000041, 0x00000041, 0x00000041,
    0x00000042, 0x00000042, 0x00000042, 0x00000042, 0x00000042, 0x00000042, 0x00000042, 0x00000042, 0x00000043, 0x00000043,
    0x00000043, 0x00000043, 0x00000043, 0x00000043, 0x00000043, 0x00000044, 0x00000044, 0x00000044, 0x00000044, 0x00000044,
    0x00000044, 0x00000044, 0x00000044, 0x00000045, 0x00000045, 0x00000045, 0x00000045, 0x00000045, 0x00000045, 0x00000045,
    0x00000046, 0x00000046, 0x00000046, 0x00000046, 0x00000046, 0x00000046, 0x00000046, 0x00000046, 0x00000047, 0x00000047,
    0x00000047, 0x00000047, 0x00000047, 0x00000047, 0x00000047, 0x00000048, 0x00000048, 0x00000048, 0x00000048, 0x00000048,
    0x00000048, 0x00000048, 0x00000048, 0x00000049, 0x00000049, 0x00000049, 0x00000049, 0x00000049, 0x00000049, 0x00000049,
    0x00000049, 0x0000004a, 0x0000004a, 0x0000004a, 0x0000004a, 0x0000004a, 0x0000004a, 0x0000004a, 0x0000004b, 0x0000004b,
    0x0000004b, 0x0000004b, 0x0000004b, 0x0000004b, 0x0000004b, 0x0000004b, 0x0000004c, 0x0000004c, 0x0000004c, 0x0000004c,
    0x0000004c, 0x0000004c, 0x0000004c, 0x0000004c, 0x0000004d, 0x0000004d, 0x0000004d, 0x0000004d, 0x0000004d, 0x0000004d,
    0x0000004d, 0x0000004d, 0x0000004e, 0x0000004e, 0x0000004e, 0x0000004e, 0x0000004e, 0x0000004e, 0x0000004e, 0x0000004e,
    0x0000004f, 0x0000004f, 0x0000004f, 0x0000004f, 0x0000004f, 0x0000004f, 0x0000004f, 0x0000004f, 0x00000050, 0x00000050,
    0x00000050, 0x00000050, 0x00000050, 0x00000050, 0x00000050, 0x00000050, 0x00000051, 0x00000051, 0x00000051, 0x00000051,
    0x00000051, 0x00000051, 0x00000051, 0x00000051, 0x00000052, 0x00000052, 0x00000052, 0x00000052, 0x00000052, 0x00000052,
    0x00000052, 0x00000052, 0x00000053, 0x00000053, 0x00000053, 0x00000053, 0x00000053, 0x00000053, 0x00000053, 0x00000053,
    0x00000054, 0x00000054, 0x00000054, 0x00000054, 0x00000054, 0x00000054, 0x00000054, 0x00000054, 0x00000055, 0x00000055,
    0x00000055, 0x00000055, 0x00000055, 0x00000055, 0x00000055, 0x00000055, 0x00000055, 0x00000056, 0x00000056, 0x00000056,
    0x00000056, 0x00000056, 0x00000056, 0x00000056, 0x00000056, 0x00000057, 0x00000057, 0x00000057, 0x00000057, 0x00000057,
    0x00000057, 0x00000057, 0x00000057, 0x00000057, 0x00000058, 0x00000058, 0x00000058, 0x00000058, 0x00000058, 0x00000058,
    0x00000058, 0x00000058, 0x00000059, 0x00000059, 0x00000059, 0x00000059, 0x00000059, 0x00000059, 0x00000059, 0x00000059,
    0x00000059, 0x0000005a, 0x0000005a, 0x0000005a, 0x0000005a, 0x0000005a, 0x0000005a, 0x0000005a, 0x0000005a, 0x0000005b,
    0x0000005b, 0x0000005b, 0x0000005b, 0x0000005b, 0x0000005b, 0x0000005b, 0x0000005b, 0x0000005b, 0x0000005c, 0x0000005c,
    0x0000005c, 0x0000005c, 0x0000005c, 0x0000005c, 0x0000005c, 0x0000005c, 0x0000005c, 0x0000005d, 0x0000005d, 0x0000005d,
    0x0000005d, 0x0000005d, 0x0000005d, 0x0000005d, 0x0000005d, 0x0000005e, 0x0000005e, 0x0000005e, 0x0000005e, 0x0000005e,
    0x0000005e, 0x0000005e, 0x0000005e, 0x0000005e, 0x0000005f, 0x0000005f, 0x0000005f, 0x0000005f, 0x0000005f, 0x0000005f,
    0x0000005f, 0x0000005f, 0x0000005f, 0x00000060, 0x00000060, 0x00000060, 0x00000060, 0x00000060, 0x00000060, 0x00000060,
    0x00000060, 0x00000060, 0x00000061, 0x00000061, 0x00000061, 0x00000061, 0x00000061, 0x00000061, 0x00000061, 0x00000061,
    0x00000061, 0x00000062, 0x00000062, 0x00000062, 0x00000062, 0x00000062, 0x00000062, 0x00000062, 0x00000062, 0x00000062,
    0x00000062, 0x00000063, 0x00000063, 0x00000063, 0x00000063, 0x00000063, 0x00000063, 0x00000063, 0x00000063, 0x00000063,
    0x00000064, 0x00000064, 0x00000064, 0x00000064, 0x00000064, 0x00000064, 0x00000064, 0x00000064, 0x00000064, 0x00000065,
    0x00000065, 0x00000065, 0x00000065, 0x00000065, 0x00000065, 0x00000065, 0x00000065, 0x00000065, 0x00000065, 0x00000066,
    0x00000066, 0x00000066, 0x00000066, 0x00000066, 0x00000066, 0x00000066, 0x00000066, 0x00000066, 0x00000067, 0x00000067,
    0x00000067, 0x00000067, 0x00000067, 0x00000067, 0x00000067, 0x00000067, 0x00000067, 0x00000067, 0x00000068, 0x00000068,
    0x00000068, 0x00000068, 0x00000068, 0x00000068, 0x00000068, 0x00000068, 0x00000068, 0x00000069, 0x00000069, 0x00000069,
    0x00000069, 0x00000069, 0x00000069, 0x00000069, 0x00000069, 0x00000069, 0x00000069, 0x0000006a, 0x0000006a, 0x0000006a,
    0x0000006a, 0x0000006a, 0x0000006a, 0x0000006a, 0x0000006a, 0x0000006a, 0x0000006a, 0x0000006b, 0x0000006b, 0x0000006b,
    0x0000006b, 0x0000006b, 0x0000006b, 0x0000006b, 0x0000006b, 0x0000006b, 0x0000006b, 0x0000006c, 0x0000006c, 0x0000006c,
    0x0000006c, 0x0000006c, 0x0000006c, 0x0000006c, 0x0000006c, 0x0000006c, 0x0000006c, 0x0000006d, 0x0000006d, 0x0000006d,
    0x0000006d, 0x0000006d, 0x0000006d, 0x0000006d, 0x0000006d, 0x0000006d, 0x0000006d, 0x0000006e, 0x0000006e, 0x0000006e,
    0x0000006e, 0x0000006e, 0x0000006e, 0x0000006e, 0x0000006e, 0x0000006e, 0x0000006e, 0x0000006f, 0x0000006f, 0x0000006f,
    0x0000006f, 0x0000006f, 0x0000006f, 0x0000006f, 0x0000006f, 0x0000006f, 0x0000006f, 0x0000006f, 0x00000070, 0x00000070,
    0x00000070, 0x00000070, 0x00000070, 0x00000070, 0x00000070, 0x00000070, 0x00000070, 0x00000070, 0x00000071, 0x00000071,
    0x00000071, 0x00000071, 0x00000071, 0x00000071, 0x00000071, 0x00000071, 0x00000071, 0x00000071, 0x00000072, 0x00000072,
    0x00000072, 0x00000072, 0x00000072, 0x00000072, 0x00000072, 0x00000072, 0x00000072, 0x00000072, 0x00000072, 0x00000073,
    0x00000073, 0x00000073, 0x00000073, 0x00000073, 0x00000073, 0x00000073, 0x00000073, 0x00000073, 0x00000073, 0x00000073,
    0x00000074, 0x00000074, 0x00000074, 0x00000074, 0x00000074, 0x00000074, 0x00000074, 0x00000074, 0x00000074, 0x00000074,
    0x00000074, 0x00000075, 0x00000075, 0x00000075, 0x00000075, 0x00000075, 0x00000075, 0x00000075, 0x00000075, 0x00000075,
    0x00000075, 0x00000075, 0x00000076, 0x00000076, 0x00000076, 0x00000076, 0x00000076, 0x00000076, 0x00000076, 0x00000076,
    0x00000076, 0x00000076, 0x00000076, 0x00000077, 0x00000077, 0x00000077, 0x00000077, 0x00000077, 0x00000077, 0x00000077,
    0x00000077, 0x00000077, 0x00000077, 0x00000077, 0x00000078, 0x00000078, 0x00000078, 0x00000078, 0x00000078, 0x00000078,
    0x00000078, 0x00000078, 0x00000078, 0x00000078, 0x00000078, 0x00000079, 0x00000079, 0x00000079, 0x00000079, 0x00000079,
    0x00000079, 0x00000079, 0x00000079, 0x00000079, 0x00000079, 0x00000079, 0x00000079, 0x0000007a, 0x0000007a, 0x0000007a,
    0x0000007a, 0x0000007a, 0x0000007a, 0x0000007a, 0x0000007a, 0x0000007a, 0x0000007a, 0x0000007a, 0x0000007b, 0x0000007b,
    0x0000007b, 0x0000007b, 0x0000007b, 0x0000007b, 0x0000007b, 0x0000007b, 0x0000007b, 0x0000007b, 0x0000007b, 0x0000007b,
    0x0000007c, 0x0000007c, 0x0000007c, 0x0000007c, 0x0000007c, 0x0000007c, 0x0000007c, 0x0000007c, 0x0000007c, 0x0000007c,
    0x0000007c, 0x0000007c, 0x0000007d, 0x0000007d, 0x0000007d, 0x0000007d, 0x0000007d, 0x0000007d, 0x0000007d, 0x0000007d,
    0x0000007d, 0x0000007d, 0x0000007d, 0x0000007d, 0x0000007e, 0x0000007e, 0x0000007e, 0x0000007e, 0x0000007e, 0x0000007e,
    0x0000007e, 0x0000007e, 0x0000007e, 0x0000007e, 0x0000007e, 0x0000007e, 0x0000007f, 0x0000007f, 0x0000007f, 0x0000007f,
    0x0000007f, 0x0000007f, 0x0000007f, 0x0000007f, 0x0000007f, 0x0000007f, 0x0000007f, 0x0000007f, 0x00000080, 0x00000080,
    0x00000080, 0x00000080, 0x00000080, 0x00000080, 0x00000080, 0x00000080, 0x00000080, 0x00000080, 0x00000080
].map(value => value | 0);

/**
 * @type {Pos[]}
 */
const OvalRevised =
    [
        256, 0, 256, - 4, 256, -8, 256, -13, 256, -17, 256, -22, 255, -26, 255, -31, 254, -35, 253, -40,
        253, -44, 252, -49, 251, -53, 250, -57, 249, -62, 248, -66, 247, -70, 245, -75, 244, -79, 242, -83
        , 241, -87, 239, -92, 238, -96, 236, -100, 234, -104, 232, -108, 230, -112, 228, -116, 226, -120, 224, -124, 222, -128, 220, -132,
        217, -136, 215, -139, 213, -143, 210, -147, 207, -151, 205, -154, 202, -158, 199, -161, 196, -165, 193, -168,
        190, -171, 187, -175, 184, -178, 181, -181, 178, -184, 175, -187, 171, -190, 168, -193, 165, -196, 161, -199,
        158, -202, 154, -205, 151, -207, 147, -210, 143, -213, 139, -215, 136, -217, 132, -220, 128, -222, 124, -224,
        120, -226, 116, -228, 112, -230, 108, -232, 104, -234, 100, -236, 96, -238, 92, -239, 87, -241, 83, -242,
        79, -244, 75, -245, 70, -247, 66, -248, 62, -249, 57, -250, 53, -251, 49, -252, 44, -253, 40, -253,
        35, -254, 31, -255, 26, -255, 22, -256, 17, -256, 13, -256, 8, -256, 4, -256, 0, -256, -4, -256,
        -8, -256, -13, -256, -17, -256, -22, -256, -26, -255, -31, -255, -35, -254, -40, -253, -44, -253, -49, -252,
        -53, -251, -57, -250, -62, -249, -66, -248, -70, -247, -75, -245, -79, -244, -83, -242, -87, -241, -92, -239,
        -96, -238, -100, -236, -104, -234, -108, -232, -112, -230, -116, -228, -120, -226, -124, -224, -128, -222, -132, -220,
        -136, -217, -139, -215, -143, -213, -147, -210, -151, -207, -154, -205, -158, -202, -161, -199, -165, -196, -168, -193,
        -171, -190, -175, -187, -178, -184, -181, -181, -184, -178, -187, -175, -190, -171, -193, -168, -196, -165, -199, -161,
        -202, -158, -205, -154, -207, -151, -210, -147, -213, -143, -215, -139, -217, -136, -220, -132, -222, -128, -224, -124,
        -226, -120, -228, -116, -230, -112, -232, -108, -234, -104, -236, -100, -238, -96, -239, -92, -241, -87, -242, -83,
        -244, -79, -245, -75, -247, -70, -248, -66, -249, -62, -250, -57, -251, -53, -252, -49, -253, -44, -253, -40,
        -254, -35, -255, -31, -255, -26, -256, -22, -256, -17, -256, -13, -256, -8, -256, -4, -256, 0, -256, 4,
        -256, 8, -256, 13, -256, 17, -256, 22, -255, 26, -255, 31, -254, 35, -253, 40, -253, 44, -252, 49,
        -251, 53, -250, 57, -249, 62, -248, 66, -247, 70, -245, 75, -244, 79, -242, 83, -241, 87, -239, 92,
        -238, 96, -236, 100, -234, 104, -232, 108, -230, 112, -228, 116, -226, 120, -224, 124, -222, 128, -220, 132,
        -217, 136, -215, 139, -213, 143, -210, 147, -207, 151, -205, 154, -202, 158, -199, 161, -196, 165, -193, 168,
        -190, 171, -187, 175, -184, 178, -181, 181, -178, 184, -175, 187, -171, 190, -168, 193, -165, 196, -161, 199,
        -158, 202, -154, 205, -151, 207, -147, 210, -143, 213, -139, 215, -136, 217, -132, 220, -128, 222, -124, 224,
        -120, 226, -116, 228, -112, 230, -108, 232, -104, 234, -100, 236, -96, 238, -92, 239, -87, 241, -83, 242,
        -79, 244, -75, 245, -70, 247, -66, 248, -62, 249, -57, 250, -53, 251, -49, 252, -44, 253, -40, 253,
        -35, 254, -31, 255, -26, 255, -22, 256, -17, 256, -13, 256, -8, 256, -4, 256, 0, 256, 4, 256,
        8, 256, 13, 256, 17, 256, 22, 256, 26, 255, 31, 255, 35, 254, 40, 253, 44, 253, 49, 252,
        53, 251, 57, 250, 62, 249, 66, 248, 70, 247, 75, 245, 79, 244, 83, 242, 87, 241, 92, 239,
        96, 238, 100, 236, 104, 234, 108, 232, 112, 230, 116, 228, 120, 226, 124, 224, 128, 222, 132, 220,
        136, 217, 139, 215, 143, 213, 147, 210, 151, 207, 154, 205, 158, 202, 161, 199, 165, 196, 168, 193,
        171, 190, 175, 187, 178, 184, 181, 181, 184, 178, 187, 175, 190, 171, 193, 168, 196, 165, 199, 161,
        202, 158, 205, 154, 207, 151, 210, 147, 213, 143, 215, 139, 217, 136, 220, 132, 222, 128, 224, 124,
        226, 120, 228, 116, 230, 112, 232, 108, 234, 104, 236, 100, 238, 96, 239, 92, 241, 87, 242, 83,
        244, 79, 245, 75, 247, 70, 248, 66, 249, 62, 250, 57, 251, 53, 252, 49, 253, 44, 253, 40,
        254, 35, 255, 31, 255, 26, 256, 22, 256, 17, 256, 13, 256, 8, 256, 4,
    ].reduce((result, val, idx, arr) => {
        if (idx % 2 === 0) {
            result.push(new Pos(val, arr[idx + 1]));
        }
        return result;
    }, []);

/**
 * @param {Pos} curPos 
 * @param {number} angle int
 * @param {number} dist int
 */
export const getOvalAnglePos = (curPos, angle, dist) => {
    angle = Math.floor(angle);

    const xs = ~~((dist * OvalRevised[angle].x) >> 8);
    const ys = ~~((dist * OvalRevised[angle].y) >> 9);

    curPos.x += xs;
    curPos.y += ys;
}

/**
 * @param {Pos} curPos 
 * @param {number} angle 
 * @param {number} dist 
 */
export const getAnglePos = (curPos, angle, dist) => {
    angle = Math.floor(angle);

    const xs = (dist * OvalRevised[angle].x) >> 8;
    const ys = (dist * OvalRevised[angle].y) >> 8;

    curPos.x += xs;
    curPos.y += ys;
}

export const getAngleToTarget = (nX, nY, nTargetX, nTargetY, oval) => {
    let nAngle = 0;
    let nDeltaX = Math.floor(nTargetX - nX);
    let nDeltaY = Math.floor(nTargetY - nY) * oval;

    if (nDeltaX == 0) {
        if (nDeltaY > 0) return 270;
        if (nDeltaY < 0) return 90;
    }

    if (nDeltaY == 0) {
        if (nDeltaX > 0) return 0;
        if (nDeltaX < 0) return 180;
    }

    if (nDeltaX == 0 && nDeltaY == 0) return 0;

    if (nDeltaY < nDeltaX) {
        if (-nDeltaY < nDeltaX)
            nAngle = ANGLE_000 + ArcTanTbl[MAX_ANGLE_DEGREE + ~~(MAX_ANGLE_DEGREE * nDeltaY / nDeltaX)];
        else nAngle = ANGLE_270 - ArcTanTbl[MAX_ANGLE_DEGREE + ~~(MAX_ANGLE_DEGREE * nDeltaX / nDeltaY)];
    }
    else {
        if (-nDeltaY < nDeltaX)
            nAngle = ANGLE_090 - ArcTanTbl[MAX_ANGLE_DEGREE + ~~(MAX_ANGLE_DEGREE * nDeltaX / nDeltaY)];
        else nAngle = ANGLE_180 + ArcTanTbl[MAX_ANGLE_DEGREE + ~~(MAX_ANGLE_DEGREE * nDeltaY / nDeltaX)];
    }

    nAngle = MAX_ANGLE_DEGREE - nAngle;

    if (nAngle < 0) nAngle += MAX_ANGLE_DEGREE;
    else if (nAngle >= MAX_ANGLE_DEGREE) nAngle -= MAX_ANGLE_DEGREE;

    return A1024TO360(nAngle);
}

/**
 * @param {Pos} currentPos 
 * @param {number} targetPosX 
 * @param {number} targetPosY 
 * @param {number} distance 
 */
export const getTargetPos = (currentPos, targetPosX, targetPosY, distance) => {
    const iAngle = getAngleToTarget(currentPos.x, currentPos.y, targetPosX, targetPosY, 1);

    getAnglePos(currentPos, iAngle, distance);
}