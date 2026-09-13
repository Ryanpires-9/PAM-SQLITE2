import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import AnimatedPressable from '../components/AnimatedPressable';

export default function HelpAboutScreen({ onBack }) {
  const { colors, isDark } = useTheme();

  // Accordion FAQ states
  const [expandedFaq, setExpandedFaq] = useState(null);

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'Como funciona o desconto de 5% no PIX?',
      a: 'Ao selecionar o PIX como método de pagamento no carrinho de compras, o sistema da MuriloveStore aplica automaticamente um desconto real de 5% sobre o valor total dos produtos. A confirmação do pagamento é instantânea.'
    },
    {
      q: 'Qual é o prazo de entrega e como rastrear meu pedido?',
      a: 'O prazo de entrega varia de 2 a 7 dias úteis dependendo da sua localidade. Assim que o pedido é aprovado e despachado, você pode acompanhar todas as atualizações de status em tempo real na aba "Pedidos".'
    },
    {
      q: 'Os produtos possuem garantia oficial?',
      a: 'Sim! Todos os eletrônicos comercializados na MuriloveStore contam com garantia legal e contratual de 12 meses contra defeitos de fabricação, com nota fiscal eletrônica e suporte dedicado.'
    },
    {
      q: 'Qual é a política de trocas e devoluções?',
      a: 'De acordo com o Código de Defesa do Consumidor (Art. 49), você tem até 7 dias corridos após o recebimento do pacote para solicitar a troca ou devolução sem nenhum custo adicional.'
    },
    {
      q: 'Como entrar em contato com o suporte técnico?',
      a: 'Você pode enviar um e-mail diretamente para nossa equipe técnica em cabryello@gmail.com informando o número do pedido ou sua dúvida. O atendimento funciona de segunda a sexta, das 08h às 20h.'
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: colors.bgSecondary, borderColor: colors.cardBorder }]}>
        <AnimatedPressable style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Voltar</Text>
        </AnimatedPressable>

        <Text style={[styles.headerTitle, { color: colors.text }]}>Ajuda & Sobre Nós</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* SOBRE A MURILOVESTORE */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.brandRow}>
            <View style={styles.fluentGridIcon}>
              <View style={[styles.fluentSquare, { backgroundColor: '#f25022' }]} />
              <View style={[styles.fluentSquare, { backgroundColor: '#7fba00' }]} />
              <View style={[styles.fluentSquare, { backgroundColor: '#00a4ef' }]} />
              <View style={[styles.fluentSquare, { backgroundColor: '#ffb900' }]} />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.brandTitle, { color: colors.text }]}>MuriloveStore</Text>
              <Text style={[styles.brandSubtitle, { color: colors.accent }]}>
                Eletrônicos & Tecnologia de Alta Performance
              </Text>
            </View>
          </View>

          <Text style={[styles.aboutParagraph, { color: colors.textMuted }]}>
            A <Text style={{ color: colors.text, fontWeight: '700' }}>MuriloveStore</Text> nasceu com a missão de conectar apaixonados por tecnologia aos produtos mais avançados do mercado mundial. Nossa seleção reúne os principais smartphones topo de linha, notebooks de alta produtividade, sistemas de áudio imersivo e consoles de última geração.
          </Text>

          <Text style={[styles.aboutParagraph, { color: colors.textMuted }]}>
            Nosso compromisso inegociável é com a satisfação e segurança do cliente: garantia nacional oficial de 12 meses, envio ágil com rastreamento detalhado e facilidades reais de pagamento.
          </Text>

          {/* Pilares da Marca */}
          <View style={styles.pillarsGrid}>
            <View style={[styles.pillarItem, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
              <Ionicons name="ribbon-outline" size={20} color={colors.accent} />
              <Text style={[styles.pillarTitle, { color: colors.text }]}>100% Original</Text>
              <Text style={[styles.pillarDesc, { color: colors.textMuted }]}>Produtos lacrados e certificados</Text>
            </View>

            <View style={[styles.pillarItem, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#10b981" />
              <Text style={[styles.pillarTitle, { color: colors.text }]}>12 Meses Garantia</Text>
              <Text style={[styles.pillarDesc, { color: colors.textMuted }]}>Assistência técnica nacional</Text>
            </View>
          </View>
        </View>

        {/* CENTRAL DE AJUDA & FAQ */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="help-circle-outline" size={22} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Perguntas Frequentes (FAQ)</Text>
          </View>

          {faqs.map((faq, index) => {
            const isExpanded = expandedFaq === index;
            return (
              <View key={index} style={[styles.faqItem, { borderColor: colors.cardBorder }]}>
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => toggleFaq(index)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.faqQuestion, { color: colors.text }]}>{faq.q}</Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.accent}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.faqBody}>
                    <Text style={[styles.faqAnswer, { color: colors.textMuted }]}>{faq.a}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* CONTATO E SUPORTE OFICIAL CABRYELLO */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="headset-outline" size={22} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Suporte Oficial & Atendimento</Text>
          </View>

          <View style={styles.supportBox}>
            <Text style={[styles.supportOrg, { color: colors.text }]}>
              Desenvolvido e Mantido por: <Text style={{ color: colors.accent, fontWeight: '800' }}>Cabryello</Text>
            </Text>

            <View style={styles.contactDetailRow}>
              <Ionicons name="mail" size={18} color={colors.accent} style={{ marginRight: 8 }} />
              <Text style={[styles.contactLabel, { color: colors.textMuted }]}>E-mail de Suporte:</Text>
              <Text style={[styles.contactValue, { color: colors.text }]}>cabryello@gmail.com</Text>
            </View>

            <View style={styles.contactDetailRow}>
              <Ionicons name="time" size={18} color={colors.accent} style={{ marginRight: 8 }} />
              <Text style={[styles.contactLabel, { color: colors.textMuted }]}>Horário:</Text>
              <Text style={[styles.contactValue, { color: colors.text }]}>Seg a Sex: 08h - 20h | Sáb: 09h - 15h</Text>
            </View>

            <AnimatedPressable
              style={[styles.contactButton, { backgroundColor: colors.accent }]}
              onPress={() => {
                Alert.alert(
                  'Contato com o Suporte',
                  'Para assistência rápida ou dúvidas sobre seus pedidos, envie um e-mail para:\n\ncabryello@gmail.com\n\nNossa equipe retornará em até 2 horas úteis.'
                );
              }}
            >
              <Ionicons name="chatbubbles-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.contactButtonText}>Falar com o Suporte Cabryello</Text>
            </AnimatedPressable>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 4
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800'
  },
  scroll: {
    flex: 1,
    padding: 16
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14
  },
  fluentGridIcon: {
    width: 38,
    height: 38,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between'
  },
  fluentSquare: {
    width: 17,
    height: 17,
    borderRadius: 3
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2
  },
  aboutParagraph: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10
  },
  pillarsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10
  },
  pillarItem: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    textAlign: 'center'
  },
  pillarTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center'
  },
  pillarDesc: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center'
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8
  },
  faqItem: {
    borderBottomWidth: 1,
    paddingVertical: 12
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    marginRight: 10
  },
  faqBody: {
    marginTop: 8
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 19
  },
  supportBox: {
    paddingTop: 4
  },
  supportOrg: {
    fontSize: 14,
    marginBottom: 12
  },
  contactDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5
  },
  contactLabel: {
    fontSize: 13,
    marginRight: 6
  },
  contactValue: {
    fontSize: 13,
    fontWeight: '700'
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 14
  },
  contactButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  }
});

