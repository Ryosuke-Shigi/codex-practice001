<?php

namespace Tests\Unit\Earthquake;

use App\DTO\Earthquake\Map\EarthquakeMapPinDTO;
use App\Exceptions\Earthquake\EarthquakeDetailXmlNotMappableException;
use App\Services\Earthquake\EarthquakeDetailXmlParseService;
use PHPUnit\Framework\TestCase;
use RuntimeException;

class EarthquakeDetailXmlParseServiceTest extends TestCase
{
    public function test_parse_extracts_map_display_values_from_jma_detail_xml(): void
    {
        $service = new EarthquakeDetailXmlParseService;

        $dto = $service->parse($this->earthquakeReportXml(), 123, 'fallback title');

        $this->assertSame('20260511112751', $dto->eventId);
        $this->assertSame(123, $dto->sourceEntryId);
        $this->assertSame('震源・震度情報', $dto->title);
        $this->assertSame('青森県東方沖', $dto->areaName);
        $this->assertSame('１１日１１時２７分ころ、地震がありました。', $dto->headline);
        $this->assertSame('+41.0+142.5-50000/', $dto->rawCoordinate);
        $this->assertSame('41.0000000', $dto->latitude);
        $this->assertSame('142.5000000', $dto->longitude);
        $this->assertSame(50000, $dto->depthMeter);
        $this->assertSame('4.0', $dto->magnitude);
        $this->assertSame('5-', $dto->maxIntensity);
        $this->assertSame('2026-05-11T11:27:00+09:00', $dto->occurredAt);
        $this->assertSame('2026-05-11T11:31:00+09:00', $dto->reportedAt);
        $this->assertSame('保存済み地震情報です。', $dto->comment);
    }

    public function test_is_mappable_requires_coordinates_and_max_intensity(): void
    {
        $service = new EarthquakeDetailXmlParseService;

        $this->assertTrue($service->isMappable($this->pin()));
        $this->assertFalse($service->isMappable($this->pin(latitude: null)));
        $this->assertFalse($service->isMappable($this->pin(latitude: '')));
        $this->assertFalse($service->isMappable($this->pin(longitude: null)));
        $this->assertFalse($service->isMappable($this->pin(longitude: '')));
        $this->assertFalse($service->isMappable($this->pin(maxIntensity: null)));
        $this->assertFalse($service->isMappable($this->pin(maxIntensity: '')));
    }

    public function test_parse_classifies_non_seismology_xml_as_not_mappable(): void
    {
        $this->expectException(EarthquakeDetailXmlNotMappableException::class);

        (new EarthquakeDetailXmlParseService)->parse($this->nonSeismologyReportXml(), 456, 'fallback title');
    }

    public function test_parse_keeps_broken_xml_as_parse_failure(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('気象庁 個別XMLを解析できませんでした。');

        (new EarthquakeDetailXmlParseService)->parse('<Report><broken></Report>', 456, 'fallback title');
    }

    private function pin(
        ?string $latitude = '41.0000000',
        ?string $longitude = '142.5000000',
        ?string $maxIntensity = '5-',
    ): EarthquakeMapPinDTO {
        return new EarthquakeMapPinDTO(
            eventId: '20260511112751',
            sourceEntryId: 123,
            title: '震源・震度情報',
            areaName: '青森県東方沖',
            headline: '１１日１１時２７分ころ、地震がありました。',
            rawCoordinate: '+41.0+142.5-50000/',
            latitude: $latitude,
            longitude: $longitude,
            depthMeter: 50000,
            magnitude: '4.0',
            maxIntensity: $maxIntensity,
            occurredAt: '2026-05-11T11:27:00+09:00',
            reportedAt: '2026-05-11T11:31:00+09:00',
            comment: '保存済み地震情報です。',
        );
    }

    private function earthquakeReportXml(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8"?>
<Report xmlns="http://xml.kishou.go.jp/jmaxml1/" xmlns:jmx="http://xml.kishou.go.jp/jmaxml1/">
  <Control>
    <Title>震源・震度に関する情報</Title>
    <DateTime>2026-05-11T02:31:20Z</DateTime>
    <Status>通常</Status>
    <EditorialOffice>気象庁本庁</EditorialOffice>
    <PublishingOffice>気象庁</PublishingOffice>
  </Control>
  <Head xmlns="http://xml.kishou.go.jp/jmaxml1/informationBasis1/">
    <Title>震源・震度情報</Title>
    <ReportDateTime>2026-05-11T11:31:00+09:00</ReportDateTime>
    <TargetDateTime>2026-05-11T11:31:00+09:00</TargetDateTime>
    <EventID>20260511112751</EventID>
    <InfoType>発表</InfoType>
    <Serial>1</Serial>
    <InfoKind>地震情報</InfoKind>
    <InfoKindVersion>1.0_1</InfoKindVersion>
    <Headline>
      <Text>１１日１１時２７分ころ、地震がありました。</Text>
    </Headline>
    <Comment>
      <Text>保存済み地震情報です。</Text>
    </Comment>
  </Head>
  <Body xmlns="http://xml.kishou.go.jp/jmaxml1/body/seismology1/" xmlns:jmx_eb="http://xml.kishou.go.jp/jmaxml1/elementBasis1/">
    <Earthquake>
      <OriginTime>2026-05-11T11:27:00+09:00</OriginTime>
      <ArrivalTime>2026-05-11T11:27:00+09:00</ArrivalTime>
      <Hypocenter>
        <Area>
          <Name>青森県東方沖</Name>
          <Code type="震央地名">285</Code>
          <jmx_eb:Coordinate description="北緯４１．０度　東経１４２．５度　深さ　５０ｋｍ">+41.0+142.5-50000/</jmx_eb:Coordinate>
        </Area>
      </Hypocenter>
      <jmx_eb:Magnitude type="Mj" description="Ｍ４．０">4.0</jmx_eb:Magnitude>
    </Earthquake>
    <Intensity>
      <Observation>
        <MaxInt>5-</MaxInt>
      </Observation>
    </Intensity>
  </Body>
</Report>
XML;
    }

    private function nonSeismologyReportXml(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8"?>
<Report xmlns="http://xml.kishou.go.jp/jmaxml1/" xmlns:jmx="http://xml.kishou.go.jp/jmaxml1/">
  <Control>
    <Title>津波情報</Title>
    <DateTime>2026-05-11T02:31:20Z</DateTime>
    <Status>通常</Status>
    <EditorialOffice>気象庁本庁</EditorialOffice>
    <PublishingOffice>気象庁</PublishingOffice>
  </Control>
  <Head xmlns="http://xml.kishou.go.jp/jmaxml1/informationBasis1/">
    <Title>津波情報</Title>
    <ReportDateTime>2026-05-11T11:31:00+09:00</ReportDateTime>
    <TargetDateTime>2026-05-11T11:31:00+09:00</TargetDateTime>
    <InfoKind>津波情報</InfoKind>
  </Head>
  <Body xmlns="http://xml.kishou.go.jp/jmaxml1/body/tsunami1/">
    <Tsunami>
      <Forecast>
        <Code>100</Code>
      </Forecast>
    </Tsunami>
  </Body>
</Report>
XML;
    }
}
