--
-- PostgreSQL database dump
--

\restrict n6vrMT11JSfHsKUn5mjxjFDGNd2hzrIe0v03KyZhcofrV0eVr2ygcIpsAorjp4y

-- Dumped from database version 19.0
-- Dumped by pg_dump version 19.0

-- Started on 2026-11-26 12:03:41

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 228 (class 1259 OID 16431)
-- Name: barberos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.barberos (
    id_barbero integer NOT NULL,
    nombre character varying(100) NOT NULL,
    especialidad character varying(150) NOT NULL,
    foto_url text,
    activo boolean DEFAULT true
);


ALTER TABLE public.barberos OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16430)
-- Name: barberos_id_barbero_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.barberos_id_barbero_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.barberos_id_barbero_seq OWNER TO postgres;

--
-- TOC entry 5119 (class 0 OID 0)
-- Dependencies: 227
-- Name: barberos_id_barbero_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.barberos_id_barbero_seq OWNED BY public.barberos.id_barbero;


--
-- TOC entry 232 (class 1259 OID 16458)
-- Name: citas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.citas (
    id_cita integer NOT NULL,
    id_usuario integer NOT NULL,
    id_barbero integer NOT NULL,
    fecha date NOT NULL,
    hora time without time zone NOT NULL,
    total numeric(10,2) NOT NULL,
    estado character varying(20) DEFAULT 'PENDIENTE'::character varying,
    metodo_pago character varying(20) DEFAULT 'EFECTIVO'::character varying,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT citas_estado_check CHECK (((estado)::text = ANY ((ARRAY['PENDIENTE'::character varying, 'CONFIRMADA'::character varying, 'COMPLETADA'::character varying, 'CANCELADA'::character varying])::text[]))),
    CONSTRAINT citas_metodo_pago_check CHECK (((metodo_pago)::text = ANY ((ARRAY['EFECTIVO'::character varying, 'NEQUI'::character varying, 'TARJETA'::character varying, 'TRANSFERENCIA'::character varying])::text[])))
);


ALTER TABLE public.citas OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16457)
-- Name: citas_id_cita_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.citas_id_cita_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.citas_id_cita_seq OWNER TO postgres;

--
-- TOC entry 5120 (class 0 OID 0)
-- Dependencies: 231
-- Name: citas_id_cita_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.citas_id_cita_seq OWNED BY public.citas.id_cita;


--
-- TOC entry 234 (class 1259 OID 16486)
-- Name: detalle_citas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalle_citas (
    id_detalle integer NOT NULL,
    id_cita integer NOT NULL,
    id_servicio integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL
);


ALTER TABLE public.detalle_citas OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 16485)
-- Name: detalle_citas_id_detalle_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.detalle_citas_id_detalle_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.detalle_citas_id_detalle_seq OWNER TO postgres;

--
-- TOC entry 5121 (class 0 OID 0)
-- Dependencies: 233
-- Name: detalle_citas_id_detalle_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.detalle_citas_id_detalle_seq OWNED BY public.detalle_citas.id_detalle;


--
-- TOC entry 230 (class 1259 OID 16444)
-- Name: servicios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.servicios (
    id_servicio integer NOT NULL,
    nombre character varying(100) NOT NULL,
    tipo character varying(50) NOT NULL,
    duracion_minutos integer NOT NULL,
    precio numeric(10,2) NOT NULL,
    imagen text
);


ALTER TABLE public.servicios OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16443)
-- Name: servicios_id_servicio_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.servicios_id_servicio_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.servicios_id_servicio_seq OWNER TO postgres;

--
-- TOC entry 5122 (class 0 OID 0)
-- Dependencies: 229
-- Name: servicios_id_servicio_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.servicios_id_servicio_seq OWNED BY public.servicios.id_servicio;


--
-- TOC entry 226 (class 1259 OID 16414)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id_usuario integer NOT NULL,
    nombre character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    telefono character varying(15) NOT NULL,
    password character varying(255) NOT NULL,
    rol character varying(20) DEFAULT 'CLIENTE'::character varying,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT usuarios_rol_check CHECK (((rol)::text = ANY ((ARRAY['CLIENTE'::character varying, 'ADMIN'::character varying])::text[])))
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16413)
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_usuario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_usuario_seq OWNER TO postgres;

--
-- TOC entry 5123 (class 0 OID 0)
-- Dependencies: 225
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_usuario_seq OWNED BY public.usuarios.id_usuario;


--
-- TOC entry 4924 (class 2604 OID 16434)
-- Name: barberos id_barbero; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.barberos ALTER COLUMN id_barbero SET DEFAULT nextval('public.barberos_id_barbero_seq'::regclass);


--
-- TOC entry 4927 (class 2604 OID 16461)
-- Name: citas id_cita; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.citas ALTER COLUMN id_cita SET DEFAULT nextval('public.citas_id_cita_seq'::regclass);


--
-- TOC entry 4931 (class 2604 OID 16489)
-- Name: detalle_citas id_detalle; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_citas ALTER COLUMN id_detalle SET DEFAULT nextval('public.detalle_citas_id_detalle_seq'::regclass);


--
-- TOC entry 4926 (class 2604 OID 16447)
-- Name: servicios id_servicio; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servicios ALTER COLUMN id_servicio SET DEFAULT nextval('public.servicios_id_servicio_seq'::regclass);


--
-- TOC entry 4921 (class 2604 OID 16417)
-- Name: usuarios id_usuario; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id_usuario SET DEFAULT nextval('public.usuarios_id_usuario_seq'::regclass);


--
-- TOC entry 5107 (class 0 OID 16431)
-- Dependencies: 228
-- Data for Name: barberos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.barberos (id_barbero, nombre, especialidad, foto_url, activo) FROM stdin;
1	Camilo Mendoza	Cortes Clásicos y Barba Tradicional	img/barbero1.jpg	t
2	David Mendoza	Estilos Modernos, Fades y Diseños	img/barbero2.jpg	t
3	Miguel Torres	Arreglo de Barba y Estilismo Integral	img/barbero3.jpg	t
\.


--
-- TOC entry 5111 (class 0 OID 16458)
-- Dependencies: 232
-- Data for Name: citas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.citas (id_cita, id_usuario, id_barbero, fecha, hora, total, estado, metodo_pago, fecha_creacion) FROM stdin;
1	2	1	2026-11-28	10:00:00	50000.00	CONFIRMADA	NEQUI	2026-11-26 11:22:50.464742
\.


--
-- TOC entry 5113 (class 0 OID 16486)
-- Dependencies: 234
-- Data for Name: detalle_citas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.detalle_citas (id_detalle, id_cita, id_servicio, precio_unitario) FROM stdin;
1	1	3	50000.00
\.


--
-- TOC entry 5109 (class 0 OID 16444)
-- Dependencies: 230
-- Data for Name: servicios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.servicios (id_servicio, nombre, tipo, duracion_minutos, precio, imagen) FROM stdin;
1	Corte clásico	Corte	45	35000.00	img/barber.png
2	Afeitado premium	Barba	30	25000.00	img/tradicion.png
3	Corte + barba	Combo	60	50000.00	img/calidad.png
4	Tratamiento facial	Tratamiento	40	40000.00	img/puntualidad.png
5	Perfilado de barba	Barba	25	20000.00	img/barber.png
6	Corte infantil	Corte	30	25000.00	img/tradicion.png
7	Corte degradado	Corte	50	40000.00	img/calidad.png
8	Tinte de cabello	Tratamiento	90	80000.00	img/puntualidad.png
9	Combo premium	Combo	90	75000.00	img/barber.png
10	Mascarilla negra	Tratamiento	20	20000.00	img/tradicion.png
\.


--
-- TOC entry 5105 (class 0 OID 16414)
-- Dependencies: 226
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id_usuario, nombre, email, telefono, password, rol, fecha_registro) FROM stdin;
1	Administrador Trips	admin@tripsbarber.com	3015047928	Admin123!	ADMIN	2026-11-26 11:21:51.330242
2	Angie Fuentes	angie@correo.com	3001234567	Cliente123!	CLIENTE	2026-11-26 11:21:51.330242
\.


--
-- TOC entry 5124 (class 0 OID 0)
-- Dependencies: 227
-- Name: barberos_id_barbero_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.barberos_id_barbero_seq', 3, true);


--
-- TOC entry 5125 (class 0 OID 0)
-- Dependencies: 231
-- Name: citas_id_cita_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.citas_id_cita_seq', 1, true);


--
-- TOC entry 5126 (class 0 OID 0)
-- Dependencies: 233
-- Name: detalle_citas_id_detalle_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.detalle_citas_id_detalle_seq', 1, true);


--
-- TOC entry 5127 (class 0 OID 0)
-- Dependencies: 229
-- Name: servicios_id_servicio_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.servicios_id_servicio_seq', 10, true);


--
-- TOC entry 5128 (class 0 OID 0)
-- Dependencies: 225
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_usuario_seq', 2, true);


--
-- TOC entry 4940 (class 2606 OID 16442)
-- Name: barberos barberos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.barberos
    ADD CONSTRAINT barberos_pkey PRIMARY KEY (id_barbero);


--
-- TOC entry 4944 (class 2606 OID 16474)
-- Name: citas citas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.citas
    ADD CONSTRAINT citas_pkey PRIMARY KEY (id_cita);


--
-- TOC entry 4946 (class 2606 OID 16495)
-- Name: detalle_citas detalle_citas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_citas
    ADD CONSTRAINT detalle_citas_pkey PRIMARY KEY (id_detalle);


--
-- TOC entry 4942 (class 2606 OID 16456)
-- Name: servicios servicios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servicios
    ADD CONSTRAINT servicios_pkey PRIMARY KEY (id_servicio);


--
-- TOC entry 4936 (class 2606 OID 16429)
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- TOC entry 4938 (class 2606 OID 16427)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id_usuario);


--
-- TOC entry 4947 (class 2606 OID 16480)
-- Name: citas fk_cita_barbero; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.citas
    ADD CONSTRAINT fk_cita_barbero FOREIGN KEY (id_barbero) REFERENCES public.barberos(id_barbero);


--
-- TOC entry 4948 (class 2606 OID 16475)
-- Name: citas fk_cita_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.citas
    ADD CONSTRAINT fk_cita_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario);


--
-- TOC entry 4949 (class 2606 OID 16496)
-- Name: detalle_citas fk_detalle_cita; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_citas
    ADD CONSTRAINT fk_detalle_cita FOREIGN KEY (id_cita) REFERENCES public.citas(id_cita) ON DELETE CASCADE;


--
-- TOC entry 4950 (class 2606 OID 16501)
-- Name: detalle_citas fk_detalle_servicio; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_citas
    ADD CONSTRAINT fk_detalle_servicio FOREIGN KEY (id_servicio) REFERENCES public.servicios(id_servicio);


-- Completed on 2026-11-26 12:03:42

--
-- PostgreSQL database dump complete
--

\unrestrict n6vrMT11JSfHsKUn5mjxjFDGNd2hzrIe0v03KyZhcofrV0eVr2ygcIpsAorjp4y

